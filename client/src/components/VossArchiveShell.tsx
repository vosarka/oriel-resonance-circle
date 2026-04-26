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
          --voss-void: #050506;
          --voss-deep: #0d0d12;
          --voss-panel: rgba(15, 15, 21, 0.76);
          --voss-panel-strong: rgba(10, 10, 14, 0.92);
          --voss-border: rgba(189, 163, 107, 0.14);
          --voss-border-soft: rgba(189, 163, 107, 0.09);
          --voss-gold: #bda36b;
          --voss-gold-dim: rgba(189, 163, 107, 0.52);
          --voss-cyan: #79e4ea;
          --voss-teal: #5ba4a4;
          --voss-ivory: #f1eadc;
          --voss-text: #e8e4dc;
          --voss-text-soft: #9a968e;
          --voss-text-dim: #6a665e;
          min-height: 100vh;
          position: relative;
          color: var(--voss-text);
        }

        .voss-archive-content {
          position: relative;
          min-height: 100vh;
        }

        .voss-archive-panel {
          border: 1px solid var(--voss-border);
          background:
            linear-gradient(180deg, rgba(15, 15, 21, 0.86), rgba(8, 8, 12, 0.7)),
            radial-gradient(circle at top right, rgba(121, 228, 234, 0.055), transparent 40%);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(18px);
        }

        .voss-archive-kicker {
          font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Red Hat Mono", monospace;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--voss-cyan);
        }

        .voss-archive-title {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-weight: 300;
          color: var(--voss-ivory);
          letter-spacing: -0.025em;
        }

        .voss-archive-rule {
          height: 1px;
          background: linear-gradient(90deg, var(--voss-gold), var(--voss-cyan), transparent);
        }
      `}</style>
      <div className="voss-archive-root">
        <div className="voss-archive-content">{children}</div>
      </div>
    </Layout>
  );
}
