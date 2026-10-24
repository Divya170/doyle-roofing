export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="wrap pt-hero sec-b">
      <div className="skel" style={{ height: 14, width: 180, marginBottom: 24 }} />
      <div className="skel" style={{ height: 'clamp(48px,7vw,104px)', width: 'min(720px,92%)', marginBottom: 16 }} />
      <div className="skel" style={{ height: 'clamp(48px,7vw,104px)', width: 'min(520px,80%)', marginBottom: 40 }} />
      <div className="skel" style={{ height: 'clamp(240px,34vw,460px)', borderRadius: 24 }} />
    </div>
  );
}
