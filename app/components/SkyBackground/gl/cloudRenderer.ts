import { CLOUD_SHADER } from "@/app/config/skyShader";
import type { CloudPalette } from "../skyLight";
import { GLSL_NOISE, createFullscreenTriangle, createProgram } from "./glUtils";

/**
 * トゥーン調のシェーダー雲。
 * fbm をドメインワープした密度場を閾値で切り抜き、光源方向の密度から陰影を出して
 * 3 段階 (光・中間・影) に塗り分ける。オフスクリーンに描き、2D の空に貼り込む。
 */
const CLOUD_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform vec2 uSize;      // 画面サイズ (CSS px)
uniform vec2 uOffset;    // 風で流れた量 (CSS px)
uniform float uTime;     // 秒
uniform float uScale;    // ノイズ 1 単位の CSS px
uniform float uCover;    // 雲量 0..1
uniform vec2 uLight;     // 光源の位置 (CSS px, 左上原点)
uniform vec3 uLit;
uniform vec3 uMid;
uniform vec3 uShade;
uniform vec3 uRim;
uniform float uRimAmount;
uniform float uOpacity;

${GLSL_NOISE}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    v += a * valueNoise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

// 最寄りの点からの距離の補数。点の周りが丸く盛り上がる (モコモコの粒)
float puffs(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float m = 1.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      vec2 r = o + hash22(i + o) - f;
      m = min(m, dot(r, r));
    }
  }
  return 1.0 - sqrt(m);
}

float density(vec2 px) {
  // 横長の雲にするため x を伸ばす
  vec2 p = (px + uOffset) / uScale * vec2(0.7, 1.0);
  vec2 q = vec2(
    fbm(p + vec2(0.0, uTime * 0.02)),
    fbm(p + vec2(5.2, 1.3) - uTime * 0.015)
  );
  // 大きな形は fbm、輪郭は丸い粒の重ね合わせで積雲らしいモコモコにする
  vec2 w = p + 0.6 * q;
  float d = fbm(w) * 0.7 + puffs(w * 2.2) * 0.22 + puffs(w * 4.6 + 3.1) * 0.1;
  // 雲は空の上側に浮かせる。雲量が多いほど下まで広がる。
  // 下端が一直線にならないよう、境目をノイズで揺らす
  float y = px.y / uSize.y + (q.x - 0.5) * 0.12;
  float bottom = mix(0.45, 0.85, uCover);
  float band = smoothstep(0.0, 0.1, y) * (1.0 - smoothstep(bottom - 0.35, bottom, y));
  return d * band;
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  float threshold = mix(0.68, 0.44, uCover);
  float c = density(px) - threshold;
  if (c <= 0.0) {
    outColor = vec4(0.0);
    return;
  }

  // 光は「上から」と「光源の方向から」の中間で当てる。
  // 光源側に雲が薄く反対側に厚い所 (光源側の縁) が明るく、逆側の縁が影になる
  vec2 toLight = normalize(mix(vec2(0.0, -1.0), normalize(uLight - px + 1e-4), 0.45));
  float toward = density(px + toLight * 28.0) - threshold;
  float away = density(px - toLight * 28.0) - threshold;
  float light = 0.5 + (away - toward) * 4.0;
  float occlusion = clamp(toward * 6.0, 0.0, 1.0);

  // セル画風に 3 段階へ量子化 (境目だけ少しぼかしてジャギーを抑える)
  // 境目の幅は画面上の 1px 前後に揃える (密度の傾きが緩い所でもにじまない)
  float lw = max(fwidth(light), 1e-4);
  vec3 col = mix(uShade, uMid, smoothstep(0.32 - lw, 0.32 + lw, light));
  col = mix(col, uLit, smoothstep(0.62 - lw, 0.62 + lw, light));

  // 光源側の縁を色づける
  float cw = max(fwidth(c), 1e-4);
  float rim = (1.0 - smoothstep(cw * 2.0, cw * 4.0, c)) * (1.0 - occlusion)
    * smoothstep(0.5, 0.7, light);
  col = mix(col, uRim, rim * uRimAmount);

  float alpha = smoothstep(0.0, cw * 1.5, c) * uOpacity;
  outColor = vec4(col * alpha, alpha);
}`;

export type CloudFrame = {
  width: number;
  height: number;
  dtMs: number;
  cover: number;
  wind: number;
  light: { x: number; y: number };
  palette: CloudPalette;
};

export type CloudRenderer = {
  /** 雲を描いた canvas を返す。使えない状態なら null (呼び出し側で 2D 描画に戻す) */
  render(frame: CloudFrame): HTMLCanvasElement | null;
  dispose(): void;
};

export function createCloudRenderer(resolution: number): CloudRenderer | null {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!gl) return null;

  const program = createProgram(gl, CLOUD_FS);
  if (!program) return null;
  const tri = createFullscreenTriangle(gl, program);
  if (!tri) return null;

  const names = [
    "uSize", "uOffset", "uTime", "uScale", "uCover", "uLight",
    "uLit", "uMid", "uShade", "uRim", "uRimAmount", "uOpacity",
  ] as const;
  const u = Object.fromEntries(
    names.map((n) => [n, gl.getUniformLocation(program, n)]),
  ) as Record<(typeof names)[number], WebGLUniformLocation | null>;

  let lost = false;
  canvas.addEventListener("webglcontextlost", () => {
    lost = true;
  });

  let offsetX = 0;
  let time = 0;

  return {
    render(frame) {
      if (lost) return null;
      const bw = Math.max(1, Math.round(frame.width * resolution));
      const bh = Math.max(1, Math.round(frame.height * resolution));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }

      const dt = frame.dtMs / 1000;
      time += dt;
      // 左から右へ流れる (2D の雲と同じ向き)
      offsetX -= (CLOUD_SHADER.drift.base + frame.wind * CLOUD_SHADER.drift.windFactor) * dt;

      gl.viewport(0, 0, bw, bh);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(u.uSize, frame.width, frame.height);
      gl.uniform2f(u.uOffset, offsetX, 0);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uScale, CLOUD_SHADER.scale);
      gl.uniform1f(u.uCover, Math.min(1, frame.cover));
      gl.uniform2f(u.uLight, frame.light.x, frame.light.y);
      gl.uniform3fv(u.uLit, frame.palette.lit);
      gl.uniform3fv(u.uMid, frame.palette.mid);
      gl.uniform3fv(u.uShade, frame.palette.shade);
      gl.uniform3fv(u.uRim, frame.palette.rim);
      gl.uniform1f(u.uRimAmount, frame.palette.rimAmount);
      gl.uniform1f(u.uOpacity, CLOUD_SHADER.opacity);
      gl.bindVertexArray(tri.vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      return canvas;
    },
    dispose() {
      gl.deleteBuffer(tri.buffer);
      gl.deleteVertexArray(tri.vao);
      gl.deleteProgram(program);
      // オフスクリーン専用なのでコンテキストごと手放す
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
