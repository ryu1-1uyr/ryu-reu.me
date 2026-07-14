/**
 * プレースホルダー skin: 角丸ボディ + 目の DOM 実装。
 * 将来ドット絵スプライトシート skin（background-position + steps()）に
 * 差し替えるまでの標準の見た目。
 */

import type { ResidentPose } from "../residentPose";
import type { ResidentSkin, ResidentSkinInstance } from "./types";

const SIZE = 26;
/** 視線追従: この距離 (px) 以内のポインタに瞳が反応する */
const GAZE_RANGE = 200;
const PUPIL_MAX_OFFSET = 1.5;

function el(tag: string, className: string, text = ""): HTMLElement {
  const e = document.createElement(tag);
  e.className = className;
  if (text) e.textContent = text;
  return e;
}

function mount(root: HTMLElement, bodyColorClass: string): ResidentSkinInstance {
  // 構造: root > wrap(テレポート scale) > body(反転・squash・tilt) > 目・雪帽子
  //       root 直下に emote（zzz / !）とパーティクル（facing の影響を受けない）
  const wrap = el("div", "h-full w-full origin-bottom transition-none");
  const body = el(
    "div",
    `relative h-full w-full origin-bottom rounded-[9px] border-2 border-illustration-stroke ${bodyColorClass}`,
  );
  const eyes = el("div", "absolute inset-0");
  const pupilL = el(
    "span",
    "absolute left-[7px] top-[9px] h-[5px] w-[3px] rounded-full bg-illustration-stroke",
  );
  const pupilR = el(
    "span",
    "absolute right-[7px] top-[9px] h-[5px] w-[3px] rounded-full bg-illustration-stroke",
  );
  const snowCap = el(
    "div",
    "absolute -top-[2px] left-[2px] right-[2px] rounded-full bg-white/90 hidden",
  );
  const zzz = el(
    "span",
    "absolute -top-4 right-[-8px] text-[9px] leading-none text-elements-headline select-none hidden",
    "z z",
  );
  const surprise = el(
    "span",
    "absolute -top-4 left-1/2 -translate-x-1/2 text-[11px] font-bold leading-none text-elements-button select-none hidden",
    "!",
  );
  const joy = el(
    "span",
    "absolute -top-4 right-[-6px] text-[10px] leading-none text-elements-headline select-none hidden",
    "♪",
  );
  const yawn = el(
    "span",
    "absolute -top-4 right-[-14px] text-[8px] leading-none text-elements-paragraph select-none hidden",
    "ふぁ…",
  );
  const particles = el("div", "absolute inset-0 hidden");
  const particleSpans: HTMLElement[] = [];
  for (let i = 0; i < 6; i++) {
    const span = el(
      "span",
      `absolute left-1/2 top-1/2 h-1 w-1 rounded-full ${bodyColorClass}`,
    );
    // 放射方向（keyframes resident-poof が参照する CSS 変数）
    const angle = (Math.PI * 2 * i) / 6;
    span.style.setProperty("--poof-dx", `${Math.cos(angle) * 16}px`);
    span.style.setProperty("--poof-dy", `${Math.sin(angle) * 16 - 4}px`);
    particleSpans.push(span);
    particles.appendChild(span);
  }

  eyes.append(pupilL, pupilR);
  body.append(eyes, snowCap);
  wrap.appendChild(body);
  root.append(wrap, zzz, surprise, joy, yawn, particles);

  // テレポートの出/入それぞれでパーティクルを発火し直すための前フレーム記憶
  let lastPoofKey = "";

  function apply(
    pose: ResidentPose,
    facing: 1 | -1,
    pointer?: { dx: number; dy: number },
  ) {
    wrap.style.transform = `scale(${pose.scale})`;
    // rotate は facing 反転の内側にあるため、facing を掛けてワールド座標系の傾きに戻す
    const crouchY = pose.crouch ? 0.75 : 1;
    body.style.transform = `scaleX(${facing}) rotate(${pose.tilt * facing}deg) scaleY(${pose.squashY * crouchY})`;

    // 瞳: まばたき + 視線追従
    eyes.style.transform = `scaleY(${pose.eyesClosed ? 0.15 : 1})`;
    let px = 0;
    let py = 0;
    if (pointer) {
      const dist = Math.hypot(pointer.dx, pointer.dy);
      if (dist < GAZE_RANGE && dist > 1) {
        px = (pointer.dx / dist) * PUPIL_MAX_OFFSET * facing; // body ごと反転するため補正
        py = (pointer.dy / dist) * PUPIL_MAX_OFFSET;
      }
    }
    pupilL.style.transform = `translate(${px}px, ${py}px)`;
    pupilR.style.transform = `translate(${px}px, ${py}px)`;

    // 頭の雪
    if (pose.headSnow > 0.05) {
      snowCap.classList.remove("hidden");
      snowCap.style.height = `${Math.ceil(pose.headSnow * 5)}px`;
    } else {
      snowCap.classList.add("hidden");
    }

    zzz.classList.toggle("hidden", pose.emote !== "zzz");
    surprise.classList.toggle("hidden", pose.emote !== "surprise");
    joy.classList.toggle("hidden", pose.emote !== "joy");
    yawn.classList.toggle("hidden", pose.emote !== "yawn");

    // テレポート: 状態（out/in）が切り替わるたびにアニメーションを再発火
    if (pose.emote === "teleport") {
      const poofKey = pose.key;
      if (poofKey !== lastPoofKey) {
        particles.classList.remove("hidden");
        for (const span of particleSpans) {
          span.classList.remove("animate-resident-poof");
          // リフロー強制でアニメーションをリスタートさせる
          void span.offsetWidth;
          span.classList.add("animate-resident-poof");
        }
      }
      lastPoofKey = poofKey;
    } else {
      particles.classList.add("hidden");
      lastPoofKey = "";
    }
  }

  return {
    apply,
    unmount: () => {
      root.replaceChildren();
    },
  };
}

/** ボディ色を差し替えたプレースホルダー skin を作る（色クラスは Tailwind の完全な文字列で渡す） */
export function createPlaceholderSkin(bodyColorClass: string): ResidentSkin {
  return { size: SIZE, mount: (root) => mount(root, bodyColorClass) };
}

// Tailwind JIT が拾えるよう、色クラスはここに完全な文字列で列挙しておく
export const pinkSkin = createPlaceholderSkin("bg-elements-button");
export const blueSkin = createPlaceholderSkin("bg-illustration-main");
