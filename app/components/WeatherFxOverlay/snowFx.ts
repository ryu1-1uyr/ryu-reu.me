export type SurfaceRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NamedSurface = {
  id: string;
  rect: SurfaceRect;
  /** 手前判定に使う重なり順。大きいほど手前 */
  z: number;
};

type SnowFlake = {
  x: number;
  y: number;
  speed: number;
  wobblePhase: number;
  wobbleAmp: number;
  size: number;
  opacity: number;
};

type CollapseParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
};

type SnowAccumulation = {
  columns: number[];
  /** 列ごとの露出フラグ。手前のサーフェスに覆われた列・角丸ぶんの端は false */
  exposed: boolean[];
  prevX: number;
  prevY: number;
  /** 移動量の累積（減衰付き）。低速ドラッグでも溜まれば崩落する */
  driftAcc: number;
};

export type SnowFxState = {
  flakes: SnowFlake[];
  accumulations: Map<string, SnowAccumulation>;
  collapseParticles: CollapseParticle[];
  spawnAcc: number;
};

const MAX_FLAKES = 100;
const MAX_COLLAPSE = 150;
const SPAWN_RATE = 40;
const COL_WIDTH = 4;
const MAX_HEIGHT = 12;
const FLAKE_MIN_SPEED = 30;
const FLAKE_MAX_SPEED = 80;
const MELT_RATE = 0.003;
/** ウィンドウの角丸（rounded-lg）に雪がはみ出さないよう端を積雪対象から外す */
const CORNER_INSET = 8;
/** 累積移動量がこれを超えたら崩落。減衰があるので微小な揺れでは発火しない */
const DRIFT_COLLAPSE_PX = 12;
const DRIFT_DECAY_TAU = 400;
const DRAW_MIN_HEIGHT = 0.4;

export function createSnowFx(): SnowFxState {
  return {
    flakes: [],
    accumulations: new Map(),
    collapseParticles: [],
    spawnAcc: 0,
  };
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function getOrCreateAccumulation(
  s: SnowFxState,
  id: string,
  rect: SurfaceRect,
): SnowAccumulation {
  let acc = s.accumulations.get(id);
  const colCount = Math.max(1, Math.ceil(rect.width / COL_WIDTH));
  if (!acc || acc.columns.length !== colCount) {
    acc = {
      columns: new Array(colCount).fill(0),
      exposed: new Array(colCount).fill(true),
      prevX: rect.x,
      prevY: rect.y,
      driftAcc: 0,
    };
    s.accumulations.set(id, acc);
  }
  return acc;
}

/** 列ごとに「上に別のサーフェスが被さっていないか」を判定して露出マスクを更新する */
function updateExposure(
  acc: SnowAccumulation,
  surf: NamedSurface,
  surfaces: NamedSurface[],
): void {
  const { rect } = surf;
  for (let c = 0; c < acc.columns.length; c++) {
    const x = rect.x + c * COL_WIDTH + COL_WIDTH / 2;
    let exposed =
      x >= rect.x + CORNER_INSET && x <= rect.x + rect.width - CORNER_INSET;
    if (exposed) {
      for (const other of surfaces) {
        if (other.id === surf.id || other.z <= surf.z) continue;
        const o = other.rect;
        if (
          x >= o.x &&
          x <= o.x + o.width &&
          rect.y >= o.y &&
          rect.y <= o.y + o.height
        ) {
          exposed = false;
          break;
        }
      }
    }
    acc.exposed[c] = exposed;
  }
}

export function tickSnowFx(
  s: SnowFxState,
  deltaMs: number,
  intensity: number,
  wind: number,
  viewW: number,
  viewH: number,
  surfaces: NamedSurface[],
): void {
  const deltaSec = deltaMs / 1000;
  const windOffset = wind * 30;

  // サーフェスごとの前処理: 堆積バッファ確保・露出マスク更新・移動検出
  const driftDecay = Math.exp(-deltaMs / DRIFT_DECAY_TAU);
  for (const surf of surfaces) {
    const acc = getOrCreateAccumulation(s, surf.id, surf.rect);
    updateExposure(acc, surf, surfaces);

    const dx = surf.rect.x - acc.prevX;
    const dy = surf.rect.y - acc.prevY;
    acc.driftAcc = acc.driftAcc * driftDecay + Math.abs(dx) + Math.abs(dy);
    if (acc.driftAcc > DRIFT_COLLAPSE_PX) {
      collapseSnow(s, acc, surf.rect);
      acc.driftAcc = 0;
    }
    acc.prevX = surf.rect.x;
    acc.prevY = surf.rect.y;
  }

  // 消えたサーフェス（閉じたウィンドウ）の雪は崩して破棄
  if (s.accumulations.size > surfaces.length) {
    const liveIds = new Set(surfaces.map((surf) => surf.id));
    for (const [id, acc] of s.accumulations) {
      if (liveIds.has(id)) continue;
      collapseSnow(s, acc, {
        x: acc.prevX,
        y: acc.prevY,
        width: acc.columns.length * COL_WIDTH,
        height: 0,
      });
      s.accumulations.delete(id);
    }
  }

  s.spawnAcc += deltaMs * intensity * SPAWN_RATE * 0.001;
  while (s.spawnAcc >= 1 && s.flakes.length < MAX_FLAKES) {
    s.spawnAcc -= 1;
    s.flakes.push({
      x: rand(-30, viewW + 30),
      y: rand(-30, -5),
      speed: rand(FLAKE_MIN_SPEED, FLAKE_MAX_SPEED),
      wobblePhase: rand(0, Math.PI * 2),
      wobbleAmp: rand(15, 40),
      size: rand(2, 4),
      opacity: rand(0.5, 0.9),
    });
  }

  for (let i = s.flakes.length - 1; i >= 0; i--) {
    const f = s.flakes[i];
    f.y += f.speed * deltaSec;
    f.wobblePhase += deltaSec * 2;
    f.x +=
      Math.sin(f.wobblePhase) * f.wobbleAmp * deltaSec + windOffset * deltaSec;

    if (f.y > viewH + 20 || f.x < -50 || f.x > viewW + 50) {
      s.flakes.splice(i, 1);
      continue;
    }

    let hit = false;
    for (const { id, rect } of surfaces) {
      const acc = s.accumulations.get(id);
      if (!acc) continue;
      const colIdx = Math.floor((f.x - rect.x) / COL_WIDTH);
      if (colIdx < 0 || colIdx >= acc.columns.length) continue;
      // 手前のウィンドウに覆われた区間・角丸の端はすり抜けて下へ
      if (!acc.exposed[colIdx]) continue;

      const snowTop = rect.y - acc.columns[colIdx];
      if (f.y >= snowTop && f.y <= rect.y + 4) {
        acc.columns[colIdx] = Math.min(acc.columns[colIdx] + 0.6, MAX_HEIGHT);
        if (colIdx > 0) {
          acc.columns[colIdx - 1] = Math.min(
            acc.columns[colIdx - 1] + 0.15,
            MAX_HEIGHT,
          );
        }
        if (colIdx < acc.columns.length - 1) {
          acc.columns[colIdx + 1] = Math.min(
            acc.columns[colIdx + 1] + 0.15,
            MAX_HEIGHT,
          );
        }
        hit = true;
        break;
      }
    }
    if (hit) {
      s.flakes.splice(i, 1);
    }
  }

  // Melt when intensity is low
  if (intensity < 0.3) {
    const meltAmount = MELT_RATE * deltaMs * (1 - intensity * 3);
    for (const acc of s.accumulations.values()) {
      for (let c = 0; c < acc.columns.length; c++) {
        if (acc.columns[c] <= 0) continue;
        acc.columns[c] -= meltAmount;
        // 描画閾値未満の溶け残りが永遠に残らないよう 0 に切り捨てる
        if (acc.columns[c] < 0.05) acc.columns[c] = 0;
      }
    }
  }

  for (let i = s.collapseParticles.length - 1; i >= 0; i--) {
    const p = s.collapseParticles[i];
    p.life -= deltaMs / 1200;
    if (p.life <= 0 || p.y > viewH + 20) {
      s.collapseParticles.splice(i, 1);
      continue;
    }
    p.vy += 150 * deltaSec;
    p.x += p.vx * deltaSec;
    p.y += p.vy * deltaSec;
  }
}

function collapseSnow(
  s: SnowFxState,
  acc: SnowAccumulation,
  rect: SurfaceRect,
): void {
  for (let c = 0; c < acc.columns.length; c++) {
    const height = acc.columns[c];
    acc.columns[c] = 0;
    if (height < 0.5) continue;
    const count = Math.min(
      Math.ceil(height / 3),
      MAX_COLLAPSE - s.collapseParticles.length,
    );
    for (let j = 0; j < count; j++) {
      s.collapseParticles.push({
        x: rect.x + c * COL_WIDTH + rand(0, COL_WIDTH),
        y: rect.y - rand(0, height),
        vx: rand(-20, 20),
        vy: rand(10, 60),
        size: rand(2, 4),
        life: 1,
      });
    }
  }
}

function smoothedColumns(columns: number[]): number[] {
  const out = new Array<number>(columns.length);
  for (let c = 0; c < columns.length; c++) {
    const prev = c > 0 ? columns[c - 1] : columns[c];
    const next = c < columns.length - 1 ? columns[c + 1] : columns[c];
    out[c] = (prev + columns[c] * 2 + next) / 4;
  }
  return out;
}

function drawMoundRun(
  ctx: CanvasRenderingContext2D,
  rect: SurfaceRect,
  smooth: number[],
  from: number,
  to: number,
): void {
  const xAt = (c: number) => rect.x + c * COL_WIDTH + COL_WIDTH / 2;

  ctx.fillStyle = "rgba(235,240,248,0.92)";
  ctx.beginPath();
  ctx.moveTo(xAt(from) - COL_WIDTH / 2, rect.y);
  for (let c = from; c <= to; c++) {
    ctx.lineTo(xAt(c), rect.y - smooth[c]);
  }
  ctx.lineTo(xAt(to) + COL_WIDTH / 2, rect.y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = from; c <= to; c++) {
    if (c === from) {
      ctx.moveTo(xAt(c), rect.y - smooth[c]);
    } else {
      ctx.lineTo(xAt(c), rect.y - smooth[c]);
    }
  }
  ctx.stroke();
}

export function drawSnowFx(
  s: SnowFxState,
  ctx: CanvasRenderingContext2D,
  intensity: number,
  surfaces: NamedSurface[],
): void {
  for (const f of s.flakes) {
    ctx.globalAlpha = f.opacity * Math.min(intensity * 2, 1);
    ctx.fillStyle = "#e8eef5";
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 露出していて高さのある連続区間ごとにマウンドを描く
  // （覆われた区間を飛ばすことで、手前のウィンドウに雪が重ならない）
  for (const { id, rect } of surfaces) {
    const acc = s.accumulations.get(id);
    if (!acc) continue;

    const smooth = smoothedColumns(acc.columns);
    let runStart = -1;
    for (let c = 0; c <= smooth.length; c++) {
      const inRun =
        c < smooth.length && acc.exposed[c] && smooth[c] >= DRAW_MIN_HEIGHT;
      if (inRun && runStart === -1) runStart = c;
      if (!inRun && runStart !== -1) {
        drawMoundRun(ctx, rect, smooth, runStart, c - 1);
        runStart = -1;
      }
    }
  }

  for (const p of s.collapseParticles) {
    ctx.globalAlpha = p.life * 0.9;
    ctx.fillStyle = "#e8eef5";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
