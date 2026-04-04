type Props = {
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  avatarUrl?: string;
};

const BAR_LIGHT = "#eebbc3";
const BAR_DARK = "#ff69b4";
const STROKE = "#121629";

export function OgCard({
  title,
  description,
  thumbnailUrl,
  avatarUrl = "/me.png",
}: Props) {
  const imageUrl = thumbnailUrl ?? avatarUrl;

  return (
    // 1200×630 の背景
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#232946",
        fontFamily: "Yusei Magic, sans-serif",
      }}
    >
      {/* ウィンドウ本体: 80% サイズ = 960×504 */}
      <div
        style={{
          width: "80%",
          height: "80%",
          display: "flex",
          flexDirection: "column",
          border: `2px solid ${STROKE}`,
          borderRadius: 8,
          boxShadow: `6px 6px 0px 0px rgba(18,22,41,0.8)`,
          overflow: "hidden",
        }}
      >
        {/* タイトルバー */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            height: 44,
            background: `linear-gradient(to right, ${BAR_LIGHT}, ${BAR_DARK})`,
            borderBottom: `2px solid ${STROKE}`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: "#232946",
              fontSize: 20,
              fontWeight: 700,
              overflow: "hidden",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {title}
          </span>
          {/* ウィンドウボタン (装飾) */}
          <div
            style={{ display: "flex", gap: 6, marginLeft: 12, flexShrink: 0 }}
          >
            {(["─", "□", "✕"] as const).map((icon) => (
              <div
                key={icon}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 2,
                  border: `1px solid rgba(18,22,41,0.4)`,
                  backgroundColor: "rgba(18,22,41,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  color: "#232946",
                }}
              >
                {icon}
              </div>
            ))}
          </div>
        </div>

        {/* コンテンツエリア */}
        <div
          style={{
            flex: 1,
            display: "flex",
            backgroundColor: "#232946",
            padding: 24,
            gap: 24,
            overflow: "hidden",
          }}
        >
          {/* 左: 画像 (サムネ or アバター) — 約 75% 幅 */}
          <div
            style={{
              width: "75%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 8,
                border: `2px solid ${STROKE}`,
              }}
            />
          </div>

          {/* 右: description + サイト名 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            {/* description */}
            <span
              style={{
                color: "#b8c1ec",
                fontSize: 17,
                lineHeight: 1.7,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 7,
                WebkitBoxOrient: "vertical",
              }}
            >
              {description ?? ""}
            </span>

            {/* サイト名 + アバター */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt=""
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `1px solid ${STROKE}`,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#eebbc3", fontSize: 15 }}>
                りゆうの実験場
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
