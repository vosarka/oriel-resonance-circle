import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Download } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useRoute } from "wouter";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { signaturePageStyles } from "./signature-page-styles";

const initialForm = {
  name: "",
  email: "",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  birthCountry: "",
  timezone: "",
  focusQuestion: "",
  preferredTone: "balanced" as "mystical" | "practical" | "balanced",
  avoidAssumptions: "",
  consentAccepted: false,
};

export default function SignatureIntake() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, params] = useRoute("/signature-intake/:orderId");
  const orderId = Number(params?.orderId ?? 0);
  const utils = trpc.useUtils();
  const [form, setForm] = useState(initialForm);

  const orderQuery = trpc.signature.getOrder.useQuery(
    { orderId },
    { enabled: Boolean(user && orderId) }
  );
  const submitIntake = trpc.signature.submitIntake.useMutation({
    onSuccess: async () => {
      await utils.signature.getOrder.invalidate({ orderId });
    },
  });
  const pdfUrl = trpc.signature.getFinalPdfUrl.useMutation({
    onSuccess: result => {
      if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
    },
  });

  useEffect(() => {
    const intake = orderQuery.data?.intake;
    if (!intake) return;
    setForm({
      name: intake.name,
      email: intake.email,
      birthDate: intake.birthDate,
      birthTime: intake.birthTime,
      birthPlace: intake.birthPlace,
      birthCountry: intake.birthCountry,
      timezone: intake.timezone,
      focusQuestion: intake.focusQuestion,
      preferredTone: intake.preferredTone,
      avoidAssumptions: intake.avoidAssumptions ?? "",
      consentAccepted: intake.consentAccepted,
    });
  }, [orderQuery.data?.intake]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submitIntake.mutate({ orderId, intake: form });
  }

  const status = orderQuery.data?.order.status;
  const canSubmit =
    status === "paid" ||
    status === "intake_needed" ||
    status === "intake_received";
  const canDownload = status === "delivered" || status === "followup_used";

  return (
    <Layout>
      <style>{signaturePageStyles}</style>
      <section className="signature-page">
        <div className="signature-container">
          <div className="mb-10">
            <div className="signature-eyebrow">Signature Intake</div>
            <h1 className="signature-title mt-5">
              Prepare your <em>letter.</em>
            </h1>
            <p className="signature-lede mt-6">
              Anchor exact birth data, context, and consent before founder
              curation begins. The form keeps the same intake logic; only the
              vessel has been brought into the ORIEL Signal field.
            </p>
          </div>

          {orderQuery.isLoading ? (
            <div className="signature-panel flex items-center gap-3 p-6 signature-body">
              <Spinner
                className="signature-icon"
                size={18}
                label="Loading order"
              />
              Loading order...
            </div>
          ) : orderQuery.error ? (
            <div className="signature-error">{orderQuery.error.message}</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
              <aside className="signature-panel p-6">
                <div className="signature-status text-[0.72rem] tracking-[0.2em] text-[var(--oriel-amber)]">
                  Order #{orderId}
                </div>
                <div className="signature-body mt-4">
                  Status:{" "}
                  <span className="text-[var(--oriel-ivory)]">{status}</span>
                </div>
                <p className="signature-body mt-5">
                  Your intake gives ORIEL the exact birth data and the human
                  context needed for founder curation. The final PDF is not
                  auto-delivered from the engine output.
                </p>

                {canDownload && (
                  <button
                    type="button"
                    onClick={() => pdfUrl.mutate({ orderId })}
                    className="signature-button signature-button--primary mt-6 w-full"
                  >
                    <Download size={15} />
                    Open final PDF
                  </button>
                )}
              </aside>

              {orderQuery.data?.intake && status !== "intake_needed" ? (
                <div className="signature-panel p-8">
                  <CheckCircle2 size={34} className="signature-icon" />
                  <h2 className="signature-subheading mt-5">
                    Intake received.
                  </h2>
                  <p className="signature-body mt-4 max-w-2xl">
                    Your Signature Letter is awaiting founder curation. You can
                    return here after delivery to access the final PDF.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={onSubmit}
                  className="signature-panel p-6 md:p-8"
                >
                  <div className="signature-form-grid">
                    <Field label="Name">
                      <Input
                        value={form.name}
                        onChange={value => set("name", value)}
                        required
                      />
                    </Field>
                    <Field label="Email">
                      <Input
                        type="email"
                        value={form.email}
                        onChange={value => set("email", value)}
                        required
                      />
                    </Field>
                    <Field label="Birth date">
                      <Input
                        type="date"
                        value={form.birthDate}
                        onChange={value => set("birthDate", value)}
                        required
                      />
                    </Field>
                    <Field label="Birth time">
                      <Input
                        type="time"
                        value={form.birthTime}
                        onChange={value => set("birthTime", value)}
                        required
                      />
                    </Field>
                    <Field label="Birth place">
                      <Input
                        value={form.birthPlace}
                        onChange={value => set("birthPlace", value)}
                        required
                      />
                    </Field>
                    <Field label="Birth country">
                      <Input
                        value={form.birthCountry}
                        onChange={value => set("birthCountry", value)}
                        required
                      />
                    </Field>
                    <Field label="Timezone">
                      <Input
                        value={form.timezone}
                        onChange={value => set("timezone", value)}
                        placeholder="Europe/Bucharest"
                        required
                      />
                    </Field>
                    <Field label="Preferred tone">
                      <select
                        value={form.preferredTone}
                        onChange={event =>
                          set(
                            "preferredTone",
                            event.target.value as typeof form.preferredTone
                          )
                        }
                        className="signature-select"
                      >
                        <option value="mystical">Mystical</option>
                        <option value="practical">Practical</option>
                        <option value="balanced">Balanced</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Focus question">
                    <TextArea
                      value={form.focusQuestion}
                      onChange={value => set("focusQuestion", value)}
                      required
                    />
                  </Field>
                  <Field label="What should ORIEL avoid assuming?">
                    <TextArea
                      value={form.avoidAssumptions}
                      onChange={value => set("avoidAssumptions", value)}
                    />
                  </Field>

                  <label className="signature-consent mt-6 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.consentAccepted}
                      onChange={event =>
                        set("consentAccepted", event.target.checked)
                      }
                      className="mt-1 accent-[var(--oriel-amber)]"
                      required
                    />
                    I consent to ORIEL using this birth and intake data to
                    prepare a symbolic Signature Letter. I understand this is
                    not medical, legal, therapeutic, financial, or predictive
                    guidance.
                  </label>

                  <button
                    type="submit"
                    disabled={!canSubmit || submitIntake.isPending}
                    className="signature-button signature-button--primary mt-7 disabled:opacity-50"
                  >
                    {submitIntake.isPending ? "Submitting..." : "Submit intake"}
                  </button>

                  {submitIntake.error && (
                    <div className="signature-error mt-4">
                      {submitIntake.error.message}
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="signature-field mt-4">
      <span className="signature-field-label">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      value={value}
      type={type}
      placeholder={placeholder}
      required={required}
      onChange={event => onChange(event.target.value)}
      className="signature-input"
    />
  );
}

function TextArea({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <textarea
      value={value}
      required={required}
      onChange={event => onChange(event.target.value)}
      rows={5}
      className="signature-textarea"
    />
  );
}
