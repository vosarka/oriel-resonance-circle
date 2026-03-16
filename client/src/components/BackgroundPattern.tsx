export default function BackgroundPattern() {
  return (
    <>
      {/* Void Deep base */}
      <div className="fixed inset-0 bg-void-gradient z-0" />

      {/* HUD overlay patterns */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">

        {/* Fine grid — gold tint */}
        <div className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(189,163,107,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(189,163,107,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Subtle radial bloom top-center — warm gold */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] blur-[160px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(189,163,107,0.07) 0%, transparent 70%)" }}
        />

        {/* Rotating sacred geometry ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vmin] h-[100vmin] opacity-[0.02] animate-spin-slower">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#bda36b" strokeWidth="0.15" strokeDasharray="3 6" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="#bda36b" strokeWidth="0.1" strokeDasharray="2 4" />
            <circle cx="50" cy="50" r="18" fill="none" stroke="#5ba4a4" strokeWidth="0.1" />
            <line x1="50" y1="4" x2="50" y2="96" stroke="#bda36b" strokeWidth="0.07" />
            <line x1="4" y1="50" x2="96" y2="50" stroke="#bda36b" strokeWidth="0.07" />
            <line x1="12" y1="12" x2="88" y2="88" stroke="#bda36b" strokeWidth="0.07" />
            <line x1="88" y1="12" x2="12" y2="88" stroke="#bda36b" strokeWidth="0.07" />
          </svg>
        </div>

        {/* Corner brackets — gold */}
        <div className="absolute top-20 left-6 w-8 h-8" style={{ borderTop: "1px solid rgba(189,163,107,0.15)", borderLeft: "1px solid rgba(189,163,107,0.15)" }} />
        <div className="absolute top-20 right-6 w-8 h-8" style={{ borderTop: "1px solid rgba(189,163,107,0.15)", borderRight: "1px solid rgba(189,163,107,0.15)" }} />
        <div className="absolute bottom-20 left-6 w-8 h-8" style={{ borderBottom: "1px solid rgba(189,163,107,0.15)", borderLeft: "1px solid rgba(189,163,107,0.15)" }} />
        <div className="absolute bottom-20 right-6 w-8 h-8" style={{ borderBottom: "1px solid rgba(189,163,107,0.15)", borderRight: "1px solid rgba(189,163,107,0.15)" }} />
      </div>
    </>
  );
}
