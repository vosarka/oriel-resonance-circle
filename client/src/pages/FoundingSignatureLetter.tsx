import { useState } from "react";
import { ArrowRight, FileText, LockKeyhole, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

const C = {
  void: "#050403",
  surface: "rgba(12,10,8,0.82)",
  border: "rgba(225,198,139,0.18)",
  borderStrong: "rgba(225,198,139,0.42)",
  gold: "#e1c68b",
  goldSoft: "rgba(225,198,139,0.68)",
  text: "#f4e7c2",
  textSoft: "rgba(244,231,194,0.68)",
  textFaint: "rgba(244,231,194,0.44)",
};

const products = [
  {
    type: "glimpse" as const,
    title: "ORIEL Signature Glimpse",
    price: "€44",
    pages: "2-3 page symbolic PDF",
    description:
      "A concise first mirror: Type, Authority, one or two core codons, one main pattern, one correction protocol, and a short ORIEL reflection.",
    points: [
      "Type and Authority",
      "1-2 core codons",
      "One main pattern",
      "One correction protocol",
    ],
  },
  {
    type: "founding" as const,
    title: "ORIEL Founding Signature Letter",
    price: "€111",
    pages: "8-12 page symbolic PDF",
    description:
      "The full founding letter: centers, codons, channels, shadow/gift framing, three correction protocols, ORIEL reflection, and one clarification email.",
    points: [
      "Defined and open centers",
      "Core codons and active channels",
      "Shadow/gift framing",
      "Three correction protocols",
      "One follow-up clarification email",
    ],
  },
];

export default function FoundingSignatureLetter() {
  const { isAuthenticated } = useAuth();
  const [activeProduct, setActiveProduct] = useState<string | null>(null);
  const checkout = trpc.signature.createCheckout.useMutation({
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onSettled: () => setActiveProduct(null),
  });

  function beginCheckout(productType: "glimpse" | "founding") {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    setActiveProduct(productType);
    checkout.mutate({ productType });
  }

  return (
    <Layout>
      <section
        className="relative overflow-hidden px-5 py-20 md:px-10 md:py-28"
        style={{ background: C.void }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(225,198,139,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(225,198,139,.14)_1px,transparent_1px)] [background-size:80px_80px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(225,198,139,0.18),transparent_58%)]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-8 inline-flex items-center gap-3 border px-4 py-2 text-[11px] uppercase tracking-[0.32em]"
            style={{
              borderColor: C.border,
              color: C.goldSoft,
              background: "rgba(0,0,0,0.34)",
            }}
          >
            <Sparkles size={14} />
            Founder-curated signature letters
          </div>

          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h1
                className="font-serif text-5xl leading-[0.98] md:text-7xl"
                style={{ color: C.text, letterSpacing: 0 }}
              >
                Your static signal, prepared as a letter.
              </h1>
              <p
                className="mt-7 max-w-2xl text-base leading-8 md:text-lg"
                style={{ color: C.textSoft }}
              >
                ORIEL translates your birth-based static signature into a
                symbolic PDF for self-inquiry, pattern recognition, and one
                grounded correction protocol. Every letter is generated from the
                existing reading engine, then curated before delivery.
              </p>
            </div>

            <div
              className="border p-6"
              style={{
                borderColor: C.border,
                background: "rgba(0,0,0,0.44)",
              }}
            >
              <div className="flex items-center gap-3 text-sm" style={{ color: C.gold }}>
                <LockKeyhole size={17} />
                Boundaries
              </div>
              <p className="mt-4 text-sm leading-7" style={{ color: C.textSoft }}>
                This is symbolic guidance for reflection. It is not medical,
                legal, therapeutic, financial, or guaranteed predictive advice.
                Treat the letter as a mirror to test against lived experience,
                not as absolute truth.
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            {products.map((product) => (
              <article
                key={product.type}
                className="border p-7 transition hover:-translate-y-1"
                style={{
                  borderColor: C.border,
                  background: C.surface,
                  boxShadow: "0 30px 80px rgba(0,0,0,0.32)",
                }}
              >
                <div className="mb-8 flex items-start justify-between gap-5">
                  <div>
                    <div
                      className="mb-3 text-[11px] uppercase tracking-[0.28em]"
                      style={{ color: C.textFaint }}
                    >
                      {product.pages}
                    </div>
                    <h2 className="font-serif text-3xl" style={{ color: C.text }}>
                      {product.title}
                    </h2>
                  </div>
                  <div className="font-serif text-4xl" style={{ color: C.gold }}>
                    {product.price}
                  </div>
                </div>

                <p className="text-sm leading-7" style={{ color: C.textSoft }}>
                  {product.description}
                </p>

                <ul className="mt-7 space-y-3">
                  {product.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-3 text-sm"
                      style={{ color: C.textSoft }}
                    >
                      <FileText size={15} style={{ color: C.gold }} />
                      {point}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => beginCheckout(product.type)}
                  disabled={checkout.isPending}
                  className="mt-8 inline-flex w-full items-center justify-center gap-3 border px-5 py-4 text-sm uppercase tracking-[0.22em] transition disabled:opacity-50"
                  style={{
                    borderColor: C.borderStrong,
                    color: C.gold,
                    background: "rgba(225,198,139,0.08)",
                  }}
                >
                  {activeProduct === product.type && checkout.isPending
                    ? "Opening checkout..."
                    : "Begin"}
                  <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>

          {checkout.error && (
            <div
              className="mt-6 border p-4 text-sm"
              style={{ borderColor: "rgba(201,68,68,0.45)", color: "#f1b5a8" }}
            >
              {checkout.error.message}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
