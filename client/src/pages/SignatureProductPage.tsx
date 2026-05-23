import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  getSignatureProductByType,
  signatureProducts,
  type SignatureProductType,
} from "./signature-products";

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
  danger: "#f1b5a8",
};

export function SignatureGlimpseProductPage() {
  return <SignatureProductPage productType="glimpse" />;
}

export function FoundingSignatureProductPage() {
  return <SignatureProductPage productType="founding" />;
}

function SignatureProductPage({ productType }: { productType: SignatureProductType }) {
  const product = getSignatureProductByType(productType);
  const otherProducts = signatureProducts.filter((item) => item.type !== product.type);
  const { isAuthenticated } = useAuth();
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  const checkout = trpc.signature.createCheckout.useMutation({
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onSettled: () => setIsOpeningCheckout(false),
  });

  function beginCheckout() {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl(product.detailPath);
      return;
    }

    setIsOpeningCheckout(true);
    checkout.mutate({ productType: product.type });
  }

  return (
    <Layout hideFooter>
      <section
        className="relative overflow-hidden px-5 py-20 md:px-10 md:py-28"
        style={{ background: C.void }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(225,198,139,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(225,198,139,.14)_1px,transparent_1px)] [background-size:80px_80px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(225,198,139,0.18),transparent_58%)]" />

        <div className="relative mx-auto max-w-6xl">
          <a
            href="/founding-signature-letter"
            className="mb-8 inline-flex items-center gap-3 border px-4 py-2 text-[11px] uppercase tracking-[0.28em] transition"
            style={{
              borderColor: C.border,
              color: C.goldSoft,
              background: "rgba(0,0,0,0.34)",
            }}
          >
            <ArrowLeft size={14} />
            All signature letters
          </a>

          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div
              className="overflow-hidden border"
              style={{
                borderColor: C.border,
                background: "rgba(0,0,0,0.48)",
                boxShadow: "0 30px 90px rgba(0,0,0,0.38)",
              }}
            >
              <img
                src={product.coverSrc}
                alt={product.coverAlt}
                className="aspect-square w-full object-cover"
              />
            </div>

            <div>
              <div
                className="mb-5 inline-flex items-center gap-3 border px-4 py-2 text-[11px] uppercase tracking-[0.32em]"
                style={{
                  borderColor: C.border,
                  color: C.goldSoft,
                  background: "rgba(0,0,0,0.34)",
                }}
              >
                <Sparkles size={14} />
                {product.pages}
              </div>

              <h1
                className="font-serif text-5xl leading-[0.95] md:text-7xl"
                style={{ color: C.text, letterSpacing: 0 }}
              >
                {product.title}
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 md:text-lg" style={{ color: C.textSoft }}>
                {product.heroLead}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="font-serif text-5xl" style={{ color: C.gold }}>
                    {product.price}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: C.textFaint }}>
                    {product.priceNote}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={beginCheckout}
                  disabled={checkout.isPending || isOpeningCheckout}
                  className="inline-flex items-center justify-center gap-3 border px-6 py-4 text-sm uppercase tracking-[0.22em] transition disabled:opacity-50"
                  style={{
                    borderColor: C.borderStrong,
                    color: C.gold,
                    background: "rgba(225,198,139,0.08)",
                  }}
                >
                  {checkout.isPending || isOpeningCheckout ? "Opening checkout..." : "Begin"}
                  <ArrowRight size={16} />
                </button>
              </div>

              {checkout.error && (
                <div
                  className="mt-6 border p-4 text-sm"
                  style={{ borderColor: "rgba(201,68,68,0.45)", color: C.danger }}
                >
                  {checkout.error.message}
                </div>
              )}
            </div>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              {product.descriptionSections.map((section) => (
                <section
                  key={section.heading}
                  className="border p-6 md:p-8"
                  style={{ borderColor: C.border, background: C.surface }}
                >
                  <h2 className="font-serif text-3xl" style={{ color: C.text }}>
                    {section.heading}
                  </h2>
                  <p className="mt-4 text-sm leading-7 md:text-base md:leading-8" style={{ color: C.textSoft }}>
                    {section.body}
                  </p>
                </section>
              ))}

              <section
                className="border p-6 md:p-8"
                style={{ borderColor: C.border, background: C.surface }}
              >
                <h2 className="font-serif text-3xl" style={{ color: C.text }}>
                  What you receive
                </h2>
                <ul className="mt-6 grid gap-4 md:grid-cols-2">
                  {product.deliverables.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-7" style={{ color: C.textSoft }}>
                      <CheckCircle2 className="mt-1 shrink-0" size={17} style={{ color: C.gold }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="border p-6" style={{ borderColor: C.border, background: C.surface }}>
                <h2 className="font-serif text-2xl" style={{ color: C.text }}>
                  Best for
                </h2>
                <ul className="mt-5 space-y-4">
                  {product.bestFor.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-7" style={{ color: C.textSoft }}>
                      <FileText className="mt-1 shrink-0" size={15} style={{ color: C.gold }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border p-6" style={{ borderColor: C.border, background: C.surface }}>
                <h2 className="font-serif text-2xl" style={{ color: C.text }}>
                  How it works
                </h2>
                <ol className="mt-5 space-y-4">
                  {product.processSteps.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-7" style={{ color: C.textSoft }}>
                      <span className="font-serif text-xl" style={{ color: C.gold }}>
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </section>

              <section className="border p-6" style={{ borderColor: C.border, background: "rgba(0,0,0,0.44)" }}>
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
              </section>
            </aside>
          </div>

          {otherProducts.map((relatedProduct) => (
            <section
              key={relatedProduct.type}
              className="mt-5 border p-6 md:flex md:items-center md:justify-between md:gap-8"
              style={{ borderColor: C.border, background: "rgba(0,0,0,0.38)" }}
            >
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em]" style={{ color: C.textFaint }}>
                  Compare the other path
                </div>
                <h2 className="mt-3 font-serif text-3xl" style={{ color: C.text }}>
                  {relatedProduct.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7" style={{ color: C.textSoft }}>
                  {relatedProduct.description}
                </p>
              </div>
              <a
                href={relatedProduct.detailPath}
                className="mt-6 inline-flex items-center justify-center gap-3 border px-5 py-4 text-xs uppercase tracking-[0.22em] md:mt-0"
                style={{ borderColor: C.borderStrong, color: C.gold }}
              >
                View {relatedProduct.shortTitle}
                <ArrowRight size={15} />
              </a>
            </section>
          ))}
        </div>
      </section>
    </Layout>
  );
}
