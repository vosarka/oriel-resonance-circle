import { type ReactNode } from "react";
import Layout from "./Layout";

interface VossArchiveShellProps {
  children: ReactNode;
}

export default function VossArchiveShell({ children }: VossArchiveShellProps) {
  return (
    <Layout>
      <style>{`
        .voss-archive-root {
          --voss-void: #050505;
          --voss-deep: #0a0907;
          --voss-panel: rgba(7, 7, 6, 0.76);
          --voss-panel-strong: rgba(5, 5, 5, 0.92);
          --voss-border: rgba(216, 181, 109, 0.22);
          --voss-border-soft: rgba(216, 181, 109, 0.12);
          --voss-gold: #d8b56d;
          --voss-gold-dim: rgba(216, 181, 109, 0.52);
          --voss-amber: #e4c88c;
          --voss-ivory: #fff7e6;
          --voss-text: #e8e4dc;
          --voss-text-soft: #9a968e;
          --voss-text-dim: #6a665e;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(circle at 50% -8%, rgba(216, 181, 109, 0.09), transparent 30rem),
            radial-gradient(circle at 9% 24%, rgba(132, 96, 54, 0.12), transparent 24rem),
            radial-gradient(circle at 90% 36%, rgba(228, 200, 140, 0.055), transparent 28rem),
            linear-gradient(180deg, #050505 0%, #0a0907 48%, #030303 100%);
          color: var(--voss-text);
        }

        .voss-archive-root::before,
        .voss-archive-root::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .voss-archive-root::before {
          opacity: 0.16;
          background-image:
            linear-gradient(rgba(216, 181, 109, 0.105) 1px, transparent 1px),
            linear-gradient(90deg, rgba(216, 181, 109, 0.08) 1px, transparent 1px),
            linear-gradient(rgba(216, 181, 109, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(216, 181, 109, 0.035) 1px, transparent 1px);
          background-size: 96px 96px, 96px 96px, 12px 12px, 12px 12px;
          mask-image: radial-gradient(circle at center, black 0 48%, transparent 80%);
        }

        .voss-archive-root::after {
          opacity: 0.09;
          mix-blend-mode: screen;
          background-image:
            url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.72'/%3E%3C/svg%3E"),
            radial-gradient(circle at 20% 24%, rgba(255, 248, 232, 0.12), transparent 18rem);
        }

        .voss-archive-content {
          position: relative;
          z-index: 1;
          min-height: 100vh;
        }

        .voss-archive-panel {
          border: 1px solid var(--voss-border);
          background:
            linear-gradient(180deg, rgba(255, 248, 232, 0.035), rgba(255, 248, 232, 0.012)),
            radial-gradient(circle at top right, rgba(216, 181, 109, 0.09), transparent 40%),
            rgba(7, 7, 6, 0.74);
          border-radius: 0.18rem;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(18px);
        }

        .voss-archive-kicker {
          font-family: var(--font-ritual);
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--voss-amber);
        }

        .voss-archive-title {
          font-family: var(--font-display);
          font-weight: 300;
          color: var(--voss-ivory);
          letter-spacing: -0.025em;
        }

        .voss-archive-rule {
          height: 1px;
          background: linear-gradient(90deg, var(--voss-gold), var(--voss-amber), transparent);
        }
      `}</style>
      <div className="voss-archive-root">
        <div className="voss-archive-content">{children}</div>
      </div>
    </Layout>
  );
}
