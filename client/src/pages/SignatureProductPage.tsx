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
import { signaturePageStyles } from "./signature-page-styles";

export function SignatureGlimpseProductPage() {
  return <SignatureProductPage productType="glimpse" />;
}

export function FoundingSignatureProductPage() {
  return <SignatureProductPage productType="founding" />;
}

function SignatureProductPage({
  productType,
}: {
  productType: SignatureProductType;
}) {
  const product = getSignatureProductByType(productType);
  const otherProducts = signatureProducts.filter(
    item => item.type !== product.type
  );
  const { isAuthenticated } = useAuth();
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  const checkout = trpc.signature.createCheckout.useMutation({
    onSuccess: result => {
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
      <style>{signaturePageStyles}</style>
      <section className="signature-page">
        <div className="signature-container signature-container--wide">
          <a
            href="/founding-signature-letter"
            className="signature-button mb-8"
          >
            <ArrowLeft size={14} />
            All signature letters
          </a>

          <div className="signature-hero-grid">
            <div className="signature-panel p-3">
              <div className="signature-cover-shell aspect-square">
                <img src={product.coverSrc} alt={product.coverAlt} />
              </div>
            </div>

            <div>
              <div className="signature-eyebrow mb-5">
                <Sparkles size={14} className="signature-icon" />
                {product.pages}
              </div>

              <h1 className="signature-title">{product.title}</h1>

              <p className="signature-lede mt-7">{product.heroLead}</p>

              <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="signature-price">{product.price}</div>
                  <div className="signature-kicker mt-2">
                    {product.priceNote}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={beginCheckout}
                  disabled={checkout.isPending || isOpeningCheckout}
                  className="signature-button signature-button--primary disabled:opacity-50"
                >
                  {checkout.isPending || isOpeningCheckout
                    ? "Opening checkout..."
                    : "Begin"}
                  <ArrowRight size={16} />
                </button>
              </div>

              {checkout.error && (
                <div className="signature-error mt-6">
                  {checkout.error.message}
                </div>
              )}
            </div>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              {product.descriptionSections.map(section => (
                <section
                  key={section.heading}
                  className="signature-panel p-6 md:p-8"
                >
                  <h2 className="signature-subheading">{section.heading}</h2>
                  <p className="signature-body mt-4">{section.body}</p>
                </section>
              ))}

              <section className="signature-panel p-6 md:p-8">
                <h2 className="signature-subheading">What you receive</h2>
                <ul className="signature-list mt-6 md:grid md:grid-cols-2">
                  {product.deliverables.map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2
                        className="signature-icon mt-1 shrink-0"
                        size={17}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="signature-panel p-6">
                <h2 className="signature-subheading">Best for</h2>
                <ul className="signature-list mt-5">
                  {product.bestFor.map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <FileText
                        className="signature-icon mt-1 shrink-0"
                        size={15}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="signature-panel p-6">
                <h2 className="signature-subheading">How it works</h2>
                <ol className="signature-list mt-5">
                  {product.processSteps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="signature-step-index">{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </section>

              <section className="signature-panel p-6">
                <div className="signature-eyebrow">
                  <LockKeyhole size={15} className="signature-icon" />
                  Boundaries
                </div>
                <p className="signature-body mt-4">
                  This is symbolic guidance for reflection. It is not medical,
                  legal, therapeutic, financial, or guaranteed predictive
                  advice. Treat the letter as a mirror to test against lived
                  experience, not as absolute truth.
                </p>
              </section>
            </aside>
          </div>

          {otherProducts.map(relatedProduct => (
            <section
              key={relatedProduct.type}
              className="signature-panel mt-5 p-6 md:flex md:items-center md:justify-between md:gap-8"
            >
              <div>
                <div className="signature-kicker">Compare the other path</div>
                <h2 className="signature-subheading mt-3">
                  {relatedProduct.title}
                </h2>
                <p className="signature-body mt-3 max-w-2xl">
                  {relatedProduct.description}
                </p>
              </div>
              <a
                href={relatedProduct.detailPath}
                className="signature-button mt-6 md:mt-0"
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
