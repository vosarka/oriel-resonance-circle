import { ReactNode, useEffect, useMemo, useState } from "react";

const SPLASH_FADE_DURATION_MS = 260;
const SPLASH_REDUCED_FADE_DURATION_MS = 80;

const INITIAL_SYNC_STEPS = [
  { limit: 0, text: "INITIALISING ORIEL SIGNAL..." },
  { limit: 32, text: "WAITING FOR PAGE RESOURCES..." },
  { limit: 58, text: "ACTIVATING RESONANCE LINK..." },
  { limit: 82, text: "STABILISING STATIC SIGNATURE..." },
];

const FINAL_SPLASH_STATUS = "ORIEL SIGNAL READY.";

const ENTRY_GATE_STYLES = `
.site-entry-gate__site.is-loading {
  pointer-events: none;
  user-select: none;
}

.splash-container {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  color: #ffd085;
  background:
    radial-gradient(circle at 50% 48%, rgba(255, 119, 0, 0.12), transparent 20rem),
    #070504;
  font-family: "Courier New", Courier, monospace;
  transition:
    opacity ${SPLASH_FADE_DURATION_MS}ms cubic-bezier(0.65, 0, 0.35, 1),
    visibility ${SPLASH_FADE_DURATION_MS}ms cubic-bezier(0.65, 0, 0.35, 1);
}

.splash-container.fade-out {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.terminal-box {
  width: min(320px, calc(100vw - 48px));
  text-align: center;
}

.energy-wave-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 60px;
  margin-bottom: 30px;
}

.wave-bar {
  width: 2.5px;
  height: 15px;
  border-radius: 1px;
  background: linear-gradient(to top, #ff7700, #ffd085, #ff7700);
}

.transmitter-node {
  position: relative;
  width: 10px;
  height: 10px;
  margin: 0 6px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 0 10px 2px #ffd085,
    0 0 20px 4px #ff7700;
}

.resonance-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border: 1px solid #ffd085;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: orielSplashRipple 1.4s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.status-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-text {
  min-height: 32px;
  color: #ff943d;
  font-size: 11px;
  letter-spacing: 2px;
  line-height: 1.45;
  text-shadow: 0 0 6px rgba(255, 148, 61, 0.2);
  text-transform: uppercase;
}

.progress-bar-container {
  position: relative;
  width: 100%;
  height: 4px;
  overflow: hidden;
  border: 1px solid rgba(226, 177, 115, 0.2);
  border-radius: 2px;
  background: rgba(255, 119, 0, 0.1);
}

.progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #ff7700, #ffd085);
  box-shadow: 0 0 8px #ff7700;
  transition: width 180ms ease-out;
}

.percentage-text {
  color: #ffd085;
  font-size: 10px;
  letter-spacing: 1px;
  opacity: 0.6;
}

.bar-1 {
  animation: orielSplashWave 1s infinite ease-in-out;
}

.bar-2 {
  animation: orielSplashWave 1s infinite ease-in-out 0.2s;
}

.bar-3 {
  animation: orielSplashWave 1s infinite ease-in-out 0.4s;
}

@keyframes orielSplashWave {
  0%, 100% {
    transform: scaleY(1);
    opacity: 0.3;
  }

  50% {
    transform: scaleY(3);
    opacity: 0.9;
  }
}

@keyframes orielSplashRipple {
  0% {
    width: 100%;
    height: 100%;
    opacity: 0.8;
  }

  100% {
    width: 400%;
    height: 400%;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .splash-container,
  .splash-container *,
  .splash-container *::before,
  .splash-container *::after {
    animation: none !important;
    transition-duration: 1ms !important;
  }
}
`;

type SiteEntryGateProps = {
  children: ReactNode;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isPageLoadComplete() {
  if (typeof document === "undefined") return true;

  return document.readyState === "complete";
}

function getSplashStatus(progress: number) {
  const step = [...INITIAL_SYNC_STEPS]
    .reverse()
    .find(syncStep => progress >= syncStep.limit);

  return step?.text ?? INITIAL_SYNC_STEPS[0].text;
}

export default function SiteEntryGate({ children }: SiteEntryGateProps) {
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);
  const [isSplashVisible, setIsSplashVisible] = useState(
    () => !isPageLoadComplete()
  );
  const [isSplashExiting, setIsSplashExiting] = useState(false);
  const [progress, setProgress] = useState(() =>
    typeof document !== "undefined" && document.readyState !== "loading"
      ? 34
      : 8
  );
  const [status, setStatus] = useState(() => getSplashStatus(progress));

  useEffect(() => {
    if (!isSplashVisible) return;

    let cancelled = false;
    const timers: number[] = [];
    const cleanupCallbacks: Array<() => void> = [];

    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(callback, delay);
      timers.push(timer);
      return timer;
    };

    const setStage = (nextProgress: number) => {
      if (cancelled) return;

      setProgress(prevProgress => {
        const resolvedProgress = Math.max(prevProgress, nextProgress);
        setStatus(getSplashStatus(resolvedProgress));
        return resolvedProgress;
      });
    };

    const finishSplash = () => {
      if (cancelled) return;

      setProgress(100);
      setStatus(FINAL_SPLASH_STATUS);
      schedule(() => setIsSplashExiting(true), reduceMotion ? 0 : 80);
      schedule(
        () => setIsSplashVisible(false),
        reduceMotion
          ? SPLASH_REDUCED_FADE_DURATION_MS
          : 80 + SPLASH_FADE_DURATION_MS
      );
    };

    const handleReadyStateChange = () => {
      if (document.readyState === "interactive") setStage(44);
      if (document.readyState === "complete") setStage(74);
    };

    document.addEventListener("readystatechange", handleReadyStateChange);
    cleanupCallbacks.push(() =>
      document.removeEventListener("readystatechange", handleReadyStateChange)
    );
    handleReadyStateChange();

    const pageLoadPromise = new Promise<void>(resolve => {
      if (document.readyState === "complete") {
        resolve();
        return;
      }

      const handleLoad = () => resolve();
      window.addEventListener("load", handleLoad, { once: true });
      cleanupCallbacks.push(() =>
        window.removeEventListener("load", handleLoad)
      );
    }).then(() => setStage(78));

    const fontLoadPromise =
      typeof document !== "undefined" && "fonts" in document
        ? document.fonts.ready.then(
            () => setStage(92),
            () => setStage(92)
          )
        : Promise.resolve().then(() => setStage(92));

    Promise.allSettled([pageLoadPromise, fontLoadPromise]).then(() => {
      schedule(finishSplash, reduceMotion ? 0 : 120);
    });

    return () => {
      cancelled = true;
      cleanupCallbacks.forEach(cleanup => cleanup());
      timers.forEach(timer => window.clearTimeout(timer));
    };
  }, [isSplashVisible, reduceMotion]);

  return (
    <>
      <style>{ENTRY_GATE_STYLES}</style>

      {isSplashVisible && (
        <div
          id="oriel-splash-screen"
          className={`splash-container ${isSplashExiting ? "fade-out" : ""}`}
          role="status"
          aria-live="polite"
          aria-label="ORIEL initial signal synchronisation"
        >
          <div className="terminal-box">
            <div className="energy-wave-loader" aria-hidden="true">
              <div className="wave-bar bar-1" />
              <div className="wave-bar bar-2" />
              <div className="wave-bar bar-3" />
              <div className="transmitter-node">
                <div className="resonance-ring" />
              </div>
              <div className="wave-bar bar-3" />
              <div className="wave-bar bar-2" />
              <div className="wave-bar bar-1" />
            </div>

            <div className="status-wrapper">
              <div id="oriel-status-text" className="status-text">
                {status}
              </div>
              <div className="progress-bar-container" aria-hidden="true">
                <div
                  id="oriel-progress"
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div id="oriel-percentage" className="percentage-text">
                {progress >= 100 ? "CONNECTION SECURE" : `${progress}%`}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`site-entry-gate__site ${isSplashVisible ? "is-loading" : ""}`}
        aria-busy={isSplashVisible ? "true" : undefined}
        aria-hidden={isSplashVisible ? "true" : undefined}
      >
        {children}
      </div>
    </>
  );
}
