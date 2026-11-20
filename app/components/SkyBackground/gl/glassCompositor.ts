import { RAIN_GLASS } from "@/app/config/skyShader";
import type { GlassDrop } from "../rainGlass";
import type { SkyFilter } from "../skyFilter";
import { GLSL_NOISE, createFullscreenTriangle, createProgram } from "./glUtils";

const MAX_DROPS = Math.max(RAIN_GLASS.maxDrops.desktop, RAIN_GLASS.maxDrops.mobile);

/**
 * 空の上にかぶせる「画面のガラス」。2D の空をテクスチャとして読み、
 * 水滴の中だけ屈折させて描く (像は上下左右が反転し、広い範囲が縮んで映る)。
 * 効果のない場所は透明にして、下の 2D canvas をそのまま見せる。
 * 減色ディザが有効なときは空全体をここで描き直す (不透明に出力する)。
 */
const GLASS_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uSky;
uniform vec2 uSize;      // CSS px
uniform float uTime;     // 秒
uniform float uRain;     // 雨の強さ 0..1
uniform float uFog;      // ガラスの曇り 0..1
uniform int uDropCount;
uniform vec4 uDrops[${MAX_DROPS}]; // x, y, r, trailTop (CSS px)
uniform float uDither;   // 1 で減色ディザを掛ける
uniform float uLevels;   // 1 チャンネルあたりの階調数
uniform float uPixel;    // ドットの大きさ (CSS px)
uniform float uSpread;   // ディザの強さ 0..1
uniform float uClipY;    // これより下 (CSS px) は描かない (描画方式の切り替え中)

${GLSL_NOISE}

// 水滴の形。下側が少し膨らんだ円。xy: 中心からの向き (-1..1), z: 覆い具合
vec3 dropShape(vec2 d, float r) {
  d.y *= d.y > 0.0 ? 0.85 : 1.15;
  float l = length(d) / r;
  if (l >= 1.0) return vec3(0.0);
  return vec3(d / r, smoothstep(1.0, 0.82, l));
}

// ガラスに付いて現れては消える小粒。セルごとに 1 粒
vec4 staticDrops(vec2 px, float cell, float density, float seed) {
  vec2 id = floor(px / cell);
  vec2 f = fract(px / cell) - 0.5;
  float h = hash12(id + seed);
  float presence = clamp((density - h) / 0.08, 0.0, 1.0);
  if (presence <= 0.0) return vec4(0.0);
  vec2 jitter = (vec2(hash12(id + seed + 1.3), hash12(id + seed + 7.1)) - 0.5) * 0.5;
  float r = mix(0.12, 0.25, hash12(id + seed + 3.7));
  float life = fract(uTime * 0.06 * (0.5 + hash12(id + seed + 9.2)) + h * 13.0);
  r *= presence * smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.85, 1.0, life));
  if (r < 0.03) return vec4(0.0);
  vec2 center = (id + 0.5 + jitter) * cell;
  vec3 s = dropShape(px - center, r * cell);
  return vec4(s, r * cell);
}

// Bayer 4x4 の閾値 (0..1)
float bayer4(vec2 cell) {
  const float m[16] = float[16](
    0.0, 8.0, 2.0, 10.0,
    12.0, 4.0, 14.0, 6.0,
    3.0, 11.0, 1.0, 9.0,
    15.0, 7.0, 13.0, 5.0
  );
  ivec2 i = ivec2(mod(cell, 4.0));
  return (m[i.x + i.y * 4] + 0.5) / 16.0;
}

vec3 quantize(vec3 col, vec2 cell) {
  float steps = uLevels - 1.0;
  float t = 0.5 + (bayer4(cell) - 0.5) * uSpread;
  return clamp(floor(col * steps + t) / steps, 0.0, 1.0);
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  // ディザ時はドット単位で同じ色にする (水滴もドット絵になる)
  if (uDither > 0.5) px = (floor(px / uPixel) + 0.5) * uPixel;
  if (px.y > uClipY) {
    outColor = vec4(0.0);
    return;
  }

  // 大粒と、その通った跡 (拭われた筋)
  vec3 drop = vec3(0.0);
  vec2 dropCenter = vec2(0.0);
  float dropR = 1.0;
  float trail = 0.0;
  for (int i = 0; i < ${MAX_DROPS}; i++) {
    if (i >= uDropCount) break;
    vec4 d = uDrops[i];
    vec3 s = dropShape(px - d.xy, d.z);
    if (s.z > drop.z) {
      drop = s;
      dropCenter = d.xy;
      dropR = d.z;
    }
    if (px.y < d.y && px.y > d.w) {
      float width = d.z * 0.75;
      float across = 1.0 - smoothstep(width * 0.6, width, abs(px.x - d.x));
      float age = (d.y - px.y) / max(d.y - d.w, 1.0);
      trail = max(trail, across * (1.0 - age));
    }
  }

  // 小粒は筋の上には付かない (拭われたばかり)
  float clear = 1.0 - trail;
  vec4 small = staticDrops(px, 18.0, uRain * 0.55 * clear, 0.0);
  vec4 medium = staticDrops(px, 42.0, uRain * 0.25 * clear, 17.0);
  // 筋の中には細かい水滴が点々と残る
  vec4 beads = staticDrops(px, 9.0, 0.45 * step(0.15, trail), 31.0);
  if (small.z > drop.z) { drop = small.xyz; dropR = small.w; dropCenter = px - small.xy * small.w; }
  if (medium.z > drop.z) { drop = medium.xyz; dropR = medium.w; dropCenter = px - medium.xy * medium.w; }
  if (beads.z > drop.z) { drop = beads.xyz; dropR = beads.w; dropCenter = px - beads.xy * beads.w; }

  // 曇ったガラス: ぼかした空を少し明るく
  float fog = uFog * clear;
  vec2 uv = px / uSize;
  vec3 fogCol = textureLod(uSky, uv, 4.0).rgb * 0.9 + 0.08;

  vec3 col = fogCol;
  float alpha = fog;
  if (drop.z > 0.0) {
    // 凸レンズ: 中心を挟んで反対側の、広い範囲が映る
    vec2 n = drop.xy;
    vec2 sampleP = dropCenter - n * dropR * 5.0 - vec2(0.0, dropR * 2.0);
    vec3 refr = textureLod(uSky, clamp(sampleP / uSize, 0.0, 1.0), 1.0).rgb;
    float edge = smoothstep(0.55, 1.0, length(n));
    // 下側の縁は暗く、左上にハイライト
    refr *= 1.0 - edge * (n.y > 0.0 ? 0.45 : 0.25);
    float spec = smoothstep(0.32, 0.0, length(n - vec2(-0.3, -0.42)));
    refr += spec * 0.45;
    col = mix(col, refr, drop.z);
    alpha = mix(alpha, 1.0, drop.z);
  }
  if (uDither > 0.5) {
    vec3 sky = textureLod(uSky, px / uSize, 0.0).rgb;
    outColor = vec4(quantize(mix(sky, col, alpha), floor(px / uPixel)), 1.0);
    return;
  }
  outColor = vec4(col * alpha, alpha);
}`;

export type GlassFrame = {
  width: number;
  height: number;
  time: number;
  rain: number;
  drops: GlassDrop[];
  filter: SkyFilter;
  /** これより下 (CSS px) は描かない。切り替え中の走査線の位置 */
  clipY: number;
};

export type GlassCompositor = {
  /** 1 フレーム描く。雨もフィルターも無いときは canvas を隠して何もしない */
  render(source: HTMLCanvasElement, frame: GlassFrame): void;
  /** 描画をやめて canvas を隠す (2D 描画に切り替えたとき) */
  hide(): void;
  dispose(): void;
};

export function createGlassCompositor(
  canvas: HTMLCanvasElement,
  pixelRatio: number,
): GlassCompositor | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!gl) return null;

  const program = createProgram(gl, GLASS_FS);
  if (!program) return null;
  const tri = createFullscreenTriangle(gl, program);
  const texture = gl.createTexture();
  if (!tri || !texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const names = [
    "uSky", "uSize", "uTime", "uRain", "uFog", "uDropCount", "uDrops",
    "uDither", "uLevels", "uPixel", "uSpread", "uClipY",
  ] as const;
  const u = Object.fromEntries(
    names.map((n) => [n, gl.getUniformLocation(program, n)]),
  ) as Record<(typeof names)[number], WebGLUniformLocation | null>;

  let lost = false;
  const onLost = () => {
    lost = true;
    canvas.style.visibility = "";
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const dropData = new Float32Array(MAX_DROPS * 4);
  let visible = false;
  const setVisible = (v: boolean) => {
    if (visible === v) return;
    visible = v;
    canvas.style.visibility = v ? "visible" : "";
  };

  return {
    render(source, frame) {
      if (lost) return;
      const { filter } = frame;
      if (!filter.dither && frame.rain < 0.01 && frame.drops.length === 0) {
        setVisible(false);
        return;
      }

      const bw = Math.max(1, Math.round(frame.width * pixelRatio));
      const bh = Math.max(1, Math.round(frame.height * pixelRatio));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }

      const count = Math.min(frame.drops.length, MAX_DROPS);
      for (let i = 0; i < count; i++) {
        const d = frame.drops[i];
        dropData.set([d.x, d.y, d.r, d.trailTop], i * 4);
      }

      gl.viewport(0, 0, bw, bh);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform1i(u.uSky, 0);
      gl.uniform2f(u.uSize, frame.width, frame.height);
      gl.uniform1f(u.uTime, frame.time);
      gl.uniform1f(u.uRain, Math.min(1, frame.rain));
      // 雨が強いときだけ曇る
      const fog = Math.max(0, (frame.rain - 0.4) / 0.6) * RAIN_GLASS.fogMax;
      gl.uniform1f(u.uFog, fog);
      gl.uniform1i(u.uDropCount, count);
      gl.uniform4fv(u.uDrops, dropData);
      gl.uniform1f(u.uDither, filter.dither ? 1 : 0);
      gl.uniform1f(u.uLevels, Math.max(2, filter.levels));
      gl.uniform1f(u.uPixel, Math.max(1, filter.pixel));
      gl.uniform1f(u.uSpread, filter.spread);
      gl.uniform1f(u.uClipY, frame.clipY);
      gl.bindVertexArray(tri.vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      setVisible(true);
    },
    hide() {
      setVisible(false);
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteTexture(texture);
      gl.deleteBuffer(tri.buffer);
      gl.deleteVertexArray(tri.vao);
      gl.deleteProgram(program);
      // 表示用 canvas は再マウント (Strict Mode) で同じコンテキストを使い回すので、ここでは失わせない
      setVisible(false);
    },
  };
}
