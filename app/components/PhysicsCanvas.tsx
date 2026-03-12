"use client";
import React, { useEffect, useRef } from "react";
import Matter from "matter-js";

const {
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
  Constraint,
  Mouse,
  MouseConstraint,
  Events,
} = Matter;

// 取りうるtypeの値のユニオン型を定義
export type SampleType = "drawShapes" | "sway" | "drag";

// コンポーネントのPropsの型を定義
interface PhysicsCanvasProps {
  type: SampleType; // ここでユニオン型を指定
}

// React.FC を使用してPropsの型をコンポーネントに適用
const PhysicsCanvas: React.FC<PhysicsCanvasProps> = ({ type }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null); // useRefにもCanvas要素の型を指定
  const engineRef = useRef<Matter.Engine | null>(null); // Engine型またはnullを指定

  useEffect(() => {
    console.log("in useEffect");
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 既存のエンジンがあればクリア（Hot Reload対策など）
    if (engineRef.current) {
      // レンダリングされていたCanvas要素を親ノードから削除する処理を追加
      if (
        engineRef.current.render &&
        engineRef.current.render.canvas &&
        engineRef.current.render.canvas.parentNode
      ) {
        engineRef.current.render.canvas.parentNode.removeChild(
          engineRef.current.render.canvas
        );
      }
      Engine.clear(engineRef.current);
      engineRef.current = null;
    }

    const engine = Engine.create();
    engineRef.current = engine;
    const world = engine.world;
    console.log("engine", engine);

    const render = Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: true,
        background: "#f0f0f0",
      },
    });
    console.log("render", render);

    const runner = Runner.create();

    Render.run(render);
    Runner.run(runner, engine);

    // 壁と地面を追加（ワールドの外に落ちないように）
    const ground = Bodies.rectangle(400, 610, 810, 60, {
      isStatic: true,
      render: { fillStyle: "#665" },
    });
    const wallLeft = Bodies.rectangle(-10, 300, 20, 600, {
      isStatic: true,
      render: { fillStyle: "#665" },
    });
    const wallRight = Bodies.rectangle(810, 300, 20, 600, {
      isStatic: true,
      render: { fillStyle: "#665" },
    });
    const ceiling = Bodies.rectangle(400, -10, 810, 20, {
      isStatic: true,
      render: { fillStyle: "#665" },
    });
    Composite.add(world, [ground, wallLeft, wallRight, ceiling]);

    // --- ここから各サンプルコード ---

    if (type === "drawShapes") {
      // 1. 星型などの図形の描画
      const circle = Bodies.circle(100, 50, 30, {
        render: { fillStyle: "#f35549" },
      });
      const rectangle = Bodies.rectangle(200, 50, 50, 50, {
        render: { fillStyle: "#f3a749" },
      });
      const polygon = Bodies.polygon(300, 50, 5, 40, {
        render: { fillStyle: "#f3e749" },
      });

      Composite.add(world, [circle, rectangle, polygon]);
    } else if (type === "sway") {
      // 2. 物を揺らしてみる（シンプルな振り子）

      const ropeAnchor = Bodies.circle(400, 100, 10, {
        isStatic: true,
        render: { fillStyle: "#665" },
      });
      Composite.add(world, ropeAnchor);

      const hangingBody = Bodies.polygon(200, 300, 5, 40, {
        render: { fillStyle: "#49f355" },
        density: 0.04,
      });
      Composite.add(world, hangingBody);

      const boxA = Bodies.rectangle(200, 200, 80, 80, {
        render: { fillStyle: "#49b3f3" },
      });
      const circleB = Bodies.circle(400, 200, 40, {
        render: { fillStyle: "#b349f3" },
      });

      Composite.add(world, [boxA, circleB]);

      const ropeConstraint = Constraint.create({
        bodyA: ropeAnchor,
        bodyB: hangingBody,
        length: 200,
        stiffness: 0.3,
        damping: 0.05,
        render: {
          strokeStyle: "#555",
          lineWidth: 2,
        },
      });
      Composite.add(world, ropeConstraint);

      const mouse = Mouse.create(render.canvas);
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.2,
          render: {
            visible: false,
          },
        },
      });

      Composite.add(world, mouseConstraint);

      render.mouse = mouse;
    } else if (type === "drag") {
      // 3. 物をドラッグで動かす

      const boxA = Bodies.rectangle(200, 200, 80, 80, {
        render: { fillStyle: "#49b3f3" },
      });
      const circleB = Bodies.circle(400, 200, 40, {
        render: { fillStyle: "#b349f3" },
      });
      Composite.add(world, [boxA, circleB]);

      const mouse = Mouse.create(render.canvas);
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.2,
          render: {
            visible: false,
          },
        },
      });

      Composite.add(world, mouseConstraint);

      render.mouse = mouse;
    } else {
      // デフォルト表示（地面と壁のみ）
    }

    // クリーンアップ関数
    return () => {
      console.log("Cleaning up Matter.js");
      // レンダリングされていたCanvas要素を親ノードから削除
      //   if (render && render.canvas && render.canvas.parentNode) {
      //     render.canvas.parentNode.removeChild(render.canvas);
      //   }
      //   if (render) Render.stop(render);
      //   if (runner) Runner.stop(runner);
      //   if (engine) Engine.clear(engine);
      // //   engineRef.current = null; // Refもクリア
    };
  }, [type]); // type prop が変更されたらEffectを再実行

  return (
    <div
      style={{
        height: "90vh",
        width: "90%",
      }}
    >
      <canvas ref={canvasRef}></canvas>
      <div>canvasは？</div>
    </div>
  );
};

export default PhysicsCanvas;
