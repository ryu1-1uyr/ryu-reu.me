import {
  buildUmbrellaPixels,
  UMBRELLA_COLS,
  UMBRELLA_ROWS,
  type PixelRun,
} from "./umbrellaSprite";

// 開き具合ごとのスプライトは一度だけ作る
const cache = new Map<number, PixelRun[]>();
function runsFor(open: number): PixelRun[] {
  let runs = cache.get(open);
  if (!runs) {
    runs = buildUmbrellaPixels(open);
    cache.set(open, runs);
  }
  return runs;
}

type Props = {
  /** 1 ドットの大きさ (px) */
  dot: number;
  /** 開き具合 (0 に近いほど閉じている, 1 で全開) */
  open?: number;
};

/** ドット絵の傘。拡大してもにじまないよう crispEdges で描く */
export default function PixelUmbrella({ dot, open = 1 }: Props) {
  return (
    <svg
      viewBox={`0 0 ${UMBRELLA_COLS} ${UMBRELLA_ROWS}`}
      width={UMBRELLA_COLS * dot}
      height={UMBRELLA_ROWS * dot}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {runsFor(open).map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </svg>
  );
}
