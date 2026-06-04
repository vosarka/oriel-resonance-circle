import { useState } from "react";
import { ArrowRight, FileText, LockKeyhole, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { signatureProducts } from "./signature-products";
import { signaturePageStyles } from "./signature-page-styles";

export default function FoundingSignatureLetter() {
  const { isAuthenticated } = useAuth();
  const [activeProduct, setActiveProduct] = useState<string | null>(null);
  const checkout = trpc.signature.createCheckout.useMutation({
    onSuccess: result => {
      window.location.href = result.url;
    },
    onSettled: () => setActiveProduct(null),
  });

  function beginCheckout(
    productType: "glimpse" | "founding",
    returnTo?: string
  ) {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl(returnTo);
      return;
    }

    setActiveProduct(productType);
    checkout.mutate({ productType });
  }

  return (
    <Layout>
      <style>{signaturePageStyles}</style>
      <section className="signature-page">
        <div className="signature-container signature-container--wide">
          <div className="signature-eyebrow mb-8">
            <Sparkles size={14} className="signature-icon" />
            Founder-curated signature letters
          </div>

          <div className="signature-hero-grid">
            <div>
              <h1 className="signature-title">
                Your static <em>signal</em>, prepared as a letter.
              </h1>
              <p className="signature-lede mt-7">
                ORIEL translates your birth-based static signature into a
                symbolic PDF for self-inquiry, pattern recognition, and one
                grounded correction protocol. Every letter is generated from the
                existing reading engine, then curated before delivery.
              </p>
            </div>

            <aside className="signature-panel p-6 md:p-8">
              <div className="signature-eyebrow">
                <LockKeyhole size={15} className="signature-icon" />
                Boundaries
              </div>
              <p className="signature-body mt-5">
                This is symbolic guidance for reflection. It is not medical,
                legal, therapeutic, financial, or guaranteed predictive advice.
                Treat the letter as a mirror to test against lived experience,
                not as absolute truth.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="signature-panel p-4">
                  <div className="signature-kicker">Format</div>
                  <div className="signature-subheading mt-2 text-[1.65rem]">
                    PDF
                  </div>
                </div>
                <div className="signature-panel p-4">
                  <div className="signature-kicker">Source</div>
                  <div className="signature-subheading mt-2 text-[1.65rem]">
                    Static
                  </div>
                </div>
                <div className="signature-panel p-4">
                  <div className="signature-kicker">Review</div>
                  <div className="signature-subheading mt-2 text-[1.65rem]">
                    Human
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="signature-product-grid mt-16">
            {signatureProducts.map(product => (
              <article
                key={product.type}
                className="signature-panel signature-product-card"
              >
                <div className="signature-cover-shell aspect-square rounded-b-none border-b border-[rgba(var(--oriel-gold-rgb),0.14)]">
                  <img src={product.coverSrc} alt={product.coverAlt} />
                </div>

                <div className="p-6 md:p-8">
                  <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="signature-kicker mb-3">
                        {product.pages}
                      </div>
                      <h2 className="signature-heading">{product.title}</h2>
                    </div>
                    <div className="sm:text-right">
                      <div className="signature-price">{product.price}</div>
                      <div className="signature-kicker mt-2">
                        {product.priceNote}
                      </div>
                    </div>
                  </div>

                  <p className="signature-body">{product.description}</p>

                  <ul className="signature-list mt-7">
                    {product.points.map(point => (
                      <li key={point} className="flex items-start gap-3">
                        <FileText
                          size={15}
                          className="signature-icon mt-1 shrink-0"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={product.detailPath}
                    className="signature-button mt-8 w-full"
                  >
                    Read product page
                    <ArrowRight size={16} />
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      beginCheckout(product.type, product.detailPath)
                    }
                    disabled={checkout.isPending}
                    className="signature-button signature-button--primary mt-3 w-full disabled:opacity-50"
                  >
                    {activeProduct === product.type && checkout.isPending
                      ? "Opening checkout..."
                      : "Begin"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {checkout.error && (
            <div className="signature-error mt-6">{checkout.error.message}</div>
          )}
        </div>
      </section>
    </Layout>
  );
}
