import {
  ButtonHTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const SIGNAL_FRAGMENTS = [
  "ψ_FIELD DISTURBANCE",
  "SIGNAL ACQUIRING",
  "ORIEL CARRIER DETECTED",
  "RECURSIVE LOCK",
  "TRANSMISSION ALIGNING",
  "VOSSARI ECHOFRAME",
  "CHANNEL PHASE SHIFT",
];

type SignalInterferenceGateProps = {
  active: boolean;
  duration?: number;
  onComplete?: () => void;
  finalLabel?: string;
  phase?: "acquiring" | "locking";
};

type TransmissionTriggerOptions = {
  duration?: number;
  onComplete?: () => void;
};

function clampDuration(duration: number) {
  return Math.max(800, Math.min(duration, 2200));
}

function createBands() {
  return Array.from({ length: 5 }, (_, index) => ({
    top: 12 + Math.round(Math.random() * 74),
    height: 2 + Math.round(Math.random() * 7),
    delay: 70 + index * 115 + Math.round(Math.random() * 70),
    shift: Math.random() > 0.5 ? 18 + Math.round(Math.random() * 28) : -18 - Math.round(Math.random() * 28),
  }));
}

function createFragments(duration: number) {
  return SIGNAL_FRAGMENTS.map((label, index) => ({
    label,
    left: 12 + ((index * 17) % 68),
    top: 18 + ((index * 13) % 58),
    delay: Math.min(duration - 240, 120 + index * 135),
  }));
}

export function SignalInterferenceGate({
  active,
  duration = 1200,
  onComplete,
  finalLabel,
  phase = "locking",
}: SignalInterferenceGateProps) {
  const resolvedDuration = clampDuration(duration);
  const bands = useMemo(() => createBands(), [active]);
  const fragments = useMemo(() => createFragments(resolvedDuration), [active, resolvedDuration]);
  const statusLabel = finalLabel ?? (phase === "locking" ? "SIGNAL LOCKED" : "SIGNAL ACQUIRING");

  useEffect(() => {
    if (!active || phase !== "locking") return;

    const timer = window.setTimeout(() => {
      onComplete?.();
    }, resolvedDuration);

    return () => window.clearTimeout(timer);
  }, [active, onComplete, phase, resolvedDuration]);

  if (!active) return null;

  return (
    <div
      className={`signal-interference-gate is-${phase}`}
      aria-live="polite"
      aria-label="Transmission channel interference"
      style={{ "--signal-gate-duration": `${resolvedDuration}ms` } as React.CSSProperties}
    >
      <div className="signal-interference-field" />
      <div className="signal-interference-scanlines" />
      <div className="signal-interference-chromatic" />

      {bands.map((band, index) => (
        <div
          key={`${band.top}-${index}`}
          className="signal-interference-band"
          style={{
            top: `${band.top}%`,
            height: `${band.height}px`,
            animationDelay: `${band.delay}ms`,
            "--signal-band-shift": `${band.shift}px`,
          } as React.CSSProperties}
        />
      ))}

      {fragments.map((fragment) => (
        <span
          key={fragment.label}
          className="signal-interference-fragment"
          style={{
            left: `${fragment.left}%`,
            top: `${fragment.top}%`,
            animationDelay: `${fragment.delay}ms`,
          }}
        >
          {fragment.label}
        </span>
      ))}

      <div className="signal-interference-glyph signal-interference-glyph-a">⦿</div>
      <div className="signal-interference-glyph signal-interference-glyph-b">∇</div>
      <div className="signal-interference-glyph signal-interference-glyph-c">Ω</div>

      <div className="signal-interference-lock">
        <span>{statusLabel}</span>
      </div>
    </div>
  );
}

export function useTransmissionTrigger({
  duration = 1200,
  onComplete,
}: TransmissionTriggerOptions = {}) {
  const resolvedDuration = clampDuration(duration);
  const [phase, setPhase] = useState<"idle" | "acquiring" | "locking">("idle");
  const resolveRef = useRef<(() => void) | null>(null);

  const trigger = useCallback(() => {
    if (resolveRef.current) return Promise.resolve();

    setPhase("locking");
    return new Promise<void>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const startAcquiring = useCallback(() => {
    if (!resolveRef.current) {
      setPhase("acquiring");
    }
  }, []);

  const lock = useCallback(() => {
    if (resolveRef.current) return Promise.resolve();

    setPhase("locking");
    return new Promise<void>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const cancel = useCallback(() => {
    setPhase("idle");
    resolveRef.current?.();
    resolveRef.current = null;
  }, []);

  const complete = useCallback(() => {
    setPhase("idle");
    resolveRef.current?.();
    resolveRef.current = null;
    onComplete?.();
  }, [onComplete]);

  return {
    duration: resolvedDuration,
    isInterfering: phase !== "idle",
    trigger,
    startAcquiring,
    lock,
    cancel,
    gateProps: {
      active: phase !== "idle",
      duration: resolvedDuration,
      onComplete: complete,
      phase: phase === "idle" ? "locking" as const : phase,
    },
  };
}

type TransmissionTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  duration?: number;
  onOpen: () => void | Promise<void>;
};

// Reuse this around any future Decode/Open Transmission button when the action
// must wait until the Signal Interference Gate has finished.
export function TransmissionTrigger({
  children,
  duration = 1200,
  onOpen,
  disabled,
  onClick,
  ...props
}: TransmissionTriggerProps) {
  const gate = useTransmissionTrigger({ duration });

  return (
    <>
      <SignalInterferenceGate {...gate.gateProps} />
      <button
        {...props}
        disabled={disabled || gate.isInterfering}
        onClick={async (event) => {
          onClick?.(event);
          if (event.defaultPrevented || disabled || gate.isInterfering) return;
          await gate.trigger();
          await onOpen();
        }}
      >
        {children}
      </button>
    </>
  );
}
