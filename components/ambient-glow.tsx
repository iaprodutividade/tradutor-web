export function AmbientGlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-sky-500/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-indigo-400/10 blur-[120px]" />
      <div className="absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-blue-400/[0.06] blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
