/** ブラウン管の膜。見た目は globals.css の .crt-* と --crt-* で決まる */
export default function CrtOverlay() {
  return (
    <div className="crt-overlay" aria-hidden="true">
      <div className="crt-scanlines" />
      <div className="crt-mask" />
      <div className="crt-roll" />
      <div className="crt-vignette" />
    </div>
  );
}
