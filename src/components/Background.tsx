export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#fafbf9]">
      <div className="absolute inset-x-0 top-0 h-[900px] bg-[radial-gradient(ellipse_at_76%_10%,rgba(45,212,191,.10),transparent_40%),radial-gradient(ellipse_at_16%_28%,rgba(125,211,252,.08),transparent_36%),linear-gradient(180deg,rgba(248,250,249,.4),transparent_76%)]" />
      <div className="absolute inset-x-0 top-0 h-[900px] opacity-[.16] [background-image:radial-gradient(circle_at_1px_1px,rgba(15,118,110,.18)_1px,transparent_0)] [background-size:28px_28px] [mask-image:linear-gradient(180deg,black,transparent_78%)]" />
    </div>
  );
}
