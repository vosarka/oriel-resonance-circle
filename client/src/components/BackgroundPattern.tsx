export default function BackgroundPattern() {
  return (
    <>
      {/* Void gradient background */}
      <div className="fixed inset-0 bg-void-gradient z-0" />
      
      {/* Animated patterns */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Rotating Psi symbol */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180vw] h-[180vw] opacity-[0.03] animate-spin-slower">
          <svg className="w-full h-full text-primary" viewBox="0 0 100 100">
            <path d="M50 10 L85 80 H15 Z" fill="none" stroke="currentColor" strokeWidth="0.1"></path>
            <path d="M50 90 L15 20 H85 Z" fill="none" stroke="currentColor" strokeWidth="0.1"></path>
            <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="1 2" strokeWidth="0.1"></circle>
          </svg>
        </div>
        
        {/* Sacred grid pattern */}
        <div className="absolute inset-0 animate-shimmer-pulse [mask-image:radial-gradient(circle_at_center,black_30%,transparent_100%)]">
          <svg height="100%" width="100%">
            <defs>
              <pattern id="sacred-grid" patternUnits="userSpaceOnUse" width="60" height="60" x="0" y="0">
                <circle cx="0" cy="0" fill="none" r="30" stroke="rgb(159, 228, 154)" strokeOpacity="0.4" strokeWidth="0.4"></circle>
                <circle cx="60" cy="0" fill="none" r="30" stroke="rgb(159, 228, 154)" strokeOpacity="0.4" strokeWidth="0.4"></circle>
                <circle cx="0" cy="60" fill="none" r="30" stroke="rgb(159, 228, 154)" strokeOpacity="0.4" strokeWidth="0.4"></circle>
                <circle cx="60" cy="60" fill="none" r="30" stroke="rgb(159, 228, 154)" strokeOpacity="0.4" strokeWidth="0.4"></circle>
                <circle cx="30" cy="30" fill="none" r="30" stroke="rgb(159, 228, 154)" strokeOpacity="0.4" strokeWidth="0.4"></circle>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#sacred-grid)"></rect>
          </svg>
        </div>
      </div>
    </>
  );
}
