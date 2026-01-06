/**
 * Reusable Cyberpunk Background Component
 * Provides the void-gradient background with animated grid and rotating SVG
 */

export function CyberpunkBackground() {
  return (
    <>
      {/* Void Gradient Background */}
      <div className="fixed inset-0 bg-void-gradient z-0" />
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Rotating SVG Geometric Shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180vw] h-[180vw] opacity-[0.03] animate-spin-slower">
          <svg className="w-full h-full text-cyan-400" viewBox="0 0 100 100">
            <path d="M50 10 L85 80 H15 Z" fill="none" stroke="currentColor" strokeWidth="0.1"></path>
            <path d="M50 90 L15 20 H85 Z" fill="none" stroke="currentColor" strokeWidth="0.1"></path>
            <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="1 2" strokeWidth="0.1"></circle>
          </svg>
        </div>
        
        {/* Centered Psi Logo with Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-5">
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            {/* Outer rotating ring with cyan glow */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-spin-slow-60" />
            
            {/* Middle rotating ring (slower) */}
            <div className="absolute inset-2 rounded-full border border-cyan-400/20 animate-spin-slower" />
            
            {/* Inner glow effect */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-cyan-400/10 to-transparent blur-lg" />
            
            {/* Psi Logo Image */}
            <img
              src="/psi-logo.png"
              alt="Psi Logo"
              className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_20px_rgba(0,206,209,0.4)] animate-float"
            />
          </div>
        </div>
        
        {/* Sacred Grid Pattern with Shimmer */}
        <div className="absolute inset-0 animate-shimmer-pulse [mask-image:radial-gradient(circle_at_center,black_30%,transparent_100%)]">
          <svg height="100%" width="100%">
            <defs>
              <pattern id="sacred-grid" patternUnits="userSpaceOnUse" width="60" height="60" x="0" y="0">
                <circle cx="0" cy="0" fill="none" r="30" stroke="#00CED1" strokeWidth="0.4"></circle>
                <circle cx="60" cy="0" fill="none" r="30" stroke="#00CED1" strokeWidth="0.4"></circle>
                <circle cx="0" cy="60" fill="none" r="30" stroke="#00CED1" strokeWidth="0.4"></circle>
                <circle cx="60" cy="60" fill="none" r="30" stroke="#00CED1" strokeWidth="0.4"></circle>
                <circle cx="30" cy="30" fill="none" r="30" stroke="#00CED1" strokeWidth="0.4"></circle>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#sacred-grid)"></rect>
          </svg>
        </div>
      </div>
    </>
  );
}
