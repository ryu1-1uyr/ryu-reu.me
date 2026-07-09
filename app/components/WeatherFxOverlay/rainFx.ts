type RainDrop = {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
};

type SplashParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

type SplashRing = {
  x: number;
  y: number;
  radius: number;
  life: number;
};

export type SurfaceRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RainFxState = {
  drops: RainDrop[];
  particles: SplashParticle[];
  rings: SplashRing[];
  spawnAcc: number;
};

const MAX_DROPS = 120;
const MAX_PARTICLES = 200;
const MAX_RINGS = 40;
const SPAWN_RATE = 60;
const DROP_MIN_SPEED = 400;
const DROP_MAX_SPEED = 700;
const DROP_MIN_LEN = 8;
const DROP_MAX_LEN = 18;
const SPLASH_SPEED = 80;
const SPLASH_LIFE = 400;
const RING_LIFE = 450;
const RING_MAX_RADIUS = 8;
const PARTICLES_PER_SPLASH = 5;

export function createRainFx(): RainFxState {
  return { drops: [], particles: [], rings: [], spawnAcc: 0 };
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function tickRainFx(
  s: RainFxState,
  deltaMs: number,
  intensity: number,
  wind: number,
  viewW: number,
  viewH: number,
  surfaces: SurfaceRect[],
): void {
  const deltaSec = deltaMs / 1000;
  const windOffset = wind * 80;

  s.spawnAcc += deltaMs * intensity * SPAWN_RATE * 0.001;
  while (s.spawnAcc >= 1 && s.drops.length < MAX_DROPS) {
    s.spawnAcc -= 1;
    s.drops.push({
      x: rand(-20, viewW + 20),
      y: rand(-40, -10),
      speed: rand(DROP_MIN_SPEED, DROP_MAX_SPEED) * (0.8 + intensity * 0.4),
      length: rand(DROP_MIN_LEN, DROP_MAX_LEN),
      opacity: rand(0.4, 0.85),
    });
  }

  for (let i = s.drops.length - 1; i >= 0; i--) {
    const d = s.drops[i];
    d.y += d.speed * deltaSec;
    d.x += windOffset * deltaSec;

    if (d.y > viewH + 20) {
      s.drops.splice(i, 1);
      continue;
    }

    let hit = false;
    for (const r of surfaces) {
      if (
        d.x >= r.x &&
        d.x <= r.x + r.width &&
        d.y >= r.y &&
        d.y <= r.y + 6
      ) {
        spawnSplash(s, d.x, r.y, intensity);
        hit = true;
        break;
      }
    }
    if (hit) {
      s.drops.splice(i, 1);
    }
  }

  for (let i = s.particles.length - 1; i >= 0; i--) {
    const p = s.particles[i];
    p.life -= deltaMs / SPLASH_LIFE;
    if (p.life <= 0) {
      s.particles.splice(i, 1);
      continue;
    }
    p.vy += 300 * deltaSec;
    p.x += p.vx * deltaSec;
    p.y += p.vy * deltaSec;
  }

  for (let i = s.rings.length - 1; i >= 0; i--) {
    const r = s.rings[i];
    r.life -= deltaMs / RING_LIFE;
    if (r.life <= 0) {
      s.rings.splice(i, 1);
      continue;
    }
    r.radius += (RING_MAX_RADIUS / RING_LIFE) * deltaMs;
  }
}

function spawnSplash(s: RainFxState, x: number, y: number, intensity: number): void {
  const count = Math.min(
    PARTICLES_PER_SPLASH + (intensity > 0.7 ? 2 : 0),
    MAX_PARTICLES - s.particles.length,
  );
  for (let i = 0; i < count; i++) {
    const angle = rand(-Math.PI * 0.85, -Math.PI * 0.15);
    const speed = rand(SPLASH_SPEED * 0.5, SPLASH_SPEED * 1.2);
    s.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
    });
  }
  if (s.rings.length < MAX_RINGS) {
    s.rings.push({ x, y, radius: 1, life: 1 });
  }
}

export function drawRainFx(
  s: RainFxState,
  ctx: CanvasRenderingContext2D,
  intensity: number,
  wind: number,
): void {
  ctx.lineCap = "round";

  // 落下速度に対する横風の比で雨筋を傾ける
  const slant = wind * 0.35;
  for (const d of s.drops) {
    ctx.strokeStyle = `rgba(180,200,220,${d.opacity * intensity})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + d.length * slant, d.y + d.length);
    ctx.stroke();
  }

  for (const p of s.particles) {
    const alpha = p.life * 0.8 * intensity;
    ctx.fillStyle = `rgba(200,220,240,${alpha})`;
    const size = 2 * p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const r of s.rings) {
    const alpha = r.life * 0.5 * intensity;
    ctx.strokeStyle = `rgba(200,220,240,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
