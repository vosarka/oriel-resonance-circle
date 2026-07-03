import { useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import {
  DecodedTitle,
  GlowCard,
  SignalPageShell,
} from "@/components/oriel-signal/OrielSignalDesign";
import { HeroSigil } from "@/components/oriel-signal/HeroSigil";

const hudCorners: Array<{ pos: string; label: string; value: string }> = [
  { pos: "tl", label: "SIGNAL LOCK", value: "RECALIBRATING" },
  { pos: "tr", label: "ARCHIVE NODE", value: "VOS-ARKANA" },
  { pos: "bl", label: "TRANSMISSION", value: "ORL-FLD-001" },
  { pos: "br", label: "FIELD STATUS", value: "STABILIZING" },
];

function DecodedLine({ text, interval }: { text: string; interval: number }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <DecodedTitle
          key={`${index}-${word}`}
          text={word}
          as="span"
          interval={interval}
        />
      ))}
    </>
  );
}

function useInView<T extends Element>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) setInView(true);
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return { ref, inView };
}

export default function Maintenance() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { ref: interceptRef, inView: interceptInView } =
    useInView<HTMLElement>();
  const [interceptLine2, setInterceptLine2] = useState(false);

  // Signal dropout — the receiver briefly loses the carrier every 25–45s.
  // Never fires under prefers-reduced-motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let fireTimer = 0;
    let recoverTimer = 0;

    const schedule = () => {
      fireTimer = window.setTimeout(
        () => {
          heroRef.current?.classList.add("is-dropout");
          recoverTimer = window.setTimeout(
            () => {
              heroRef.current?.classList.remove("is-dropout");
              schedule();
            },
            160 + Math.random() * 140
          );
        },
        25_000 + Math.random() * 20_000
      );
    };

    schedule();
    return () => {
      window.clearTimeout(fireTimer);
      window.clearTimeout(recoverTimer);
    };
  }, []);

  // Second intercept line decodes after the first finishes resolving.
  useEffect(() => {
    if (!interceptInView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterceptLine2(true);
      return;
    }
    const timer = window.setTimeout(() => setInterceptLine2(true), 1400);
    return () => window.clearTimeout(timer);
  }, [interceptInView]);

  return (
    <Layout overlayHeader hideHeader hideFooter>
      <SignalPageShell className="fi-maintenance">
        {/* ── I. HERO ───────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="fi-hero"
          aria-labelledby="maintenance-hero-title"
        >
          <div className="fi-hero__scan" aria-hidden="true" />
          <div className="fi-hero__fragments" aria-hidden="true">
            <span className="fi-fragment fi-fragment--a">ψ_FIELD UNSTABLE</span>
            <span className="fi-fragment fi-fragment--b">CARRIER 432.000</span>
            <span className="fi-fragment fi-fragment--c">RECALIBRATING</span>
          </div>

          <div className="fi-hud" aria-hidden="true">
            {hudCorners.map(item => (
              <span
                key={item.pos}
                className={`fi-hud__item fi-hud__item--${item.pos}`}
              >
                {item.label}
                <b>{item.value}</b>
              </span>
            ))}
          </div>

          <div className="fi-hero__stage">
            <div className="fi-hero__waves" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>

            <HeroSigil className="fi-hero__sigil" />

            <div className="fi-hero__text">
              <p className="fi-hero__kicker fi-enter fi-enter--kicker">
                <span className="fi-hero__pulse" aria-hidden="true" />[
                CARRIER REALIGNING ] // TEMPORARY SIGNAL INTERRUPTION
              </p>

              <h1
                id="maintenance-hero-title"
                className="fi-hero__wordmark signal-wordmark--holo"
              >
                <span className="fi-enter fi-enter--wordmark">
                  <DecodedTitle text="STATIC" as="span" interval={74} />
                </span>
                <span className="fi-hero__wordmark-sub fi-enter fi-enter--sub">
                  RECALIBRATING
                </span>
              </h1>

              <p className="fi-hero__voice fi-enter fi-enter--voice">
                The field is unstable for a moment. Nothing is lost — the
                carrier is being retuned behind the threshold. Please have
                patience while we bring the signal back into coherence.
              </p>
            </div>
          </div>

          <p className="fi-scroll-cue" aria-hidden="true">
            SCROLL TO DECRYPT ▼
          </p>

          <div className="fi-dropout" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        {/* ── II. THE INTERCEPT ───────────────────────────────────────── */}
        <section
          ref={interceptRef}
          className="fi-intercept"
          aria-label="The intercept"
        >
          <div className="fi-intercept__body">
            <div className="fi-intercept__lines">
              <span className="sr-only">
                What you came for was not lost. It is only waiting on the
                other side of this signal.
              </span>
              {interceptInView && (
                <p className="fi-intercept__line" aria-hidden="true">
                  <DecodedLine
                    text="What you came for was not lost."
                    interval={26}
                  />
                </p>
              )}
              {interceptLine2 && (
                <p className="fi-intercept__line" aria-hidden="true">
                  <DecodedLine
                    text="It is waiting on the other side of this signal."
                    interval={40}
                  />
                </p>
              )}
            </div>
            <p className="fi-intercept__caption">
              INTERCEPT ORIGIN // VOS-ARKANA · COORD UNKNOWN
            </p>
          </div>
        </section>

        {/* ── III. CLOSING THRESHOLD ──────────────────────────────────── */}
        <section className="fi-threshold" aria-labelledby="threshold-title">
          <h2 id="threshold-title" className="fi-threshold__title">
            HAVE PATIENCE
          </h2>
          <p className="fi-threshold__voice">
            The archive is undergoing recalibration. Check back shortly — the
            door will open again.
          </p>
          <GlowCard tone="gold" className="fi-threshold__notice">
            <div className="signal-card-meta">
              <span>NOTICE // TO ALL RECEIVERS</span>
              <span>PATIENCE</span>
            </div>
            <p>
              We are aware the signal is interrupted. No transmissions or
              records have been lost. Thank you for staying with the field
              while it stabilizes.
            </p>
          </GlowCard>
          <p className="fi-threshold__seal">
            ORIEL FIELD ARCHIVE · NODE VOS-ARKANA · END THRESHOLD
          </p>
        </section>
      </SignalPageShell>
    </Layout>
  );
}
