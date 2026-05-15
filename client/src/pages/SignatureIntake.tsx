import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { useRoute } from "wouter";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const C = {
  bg: "#050403",
  panel: "rgba(13,11,9,0.82)",
  border: "rgba(225,198,139,0.18)",
  gold: "#e1c68b",
  text: "#f4e7c2",
  muted: "rgba(244,231,194,0.62)",
};

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
    { enabled: Boolean(user && orderId) },
  );
  const submitIntake = trpc.signature.submitIntake.useMutation({
    onSuccess: async () => {
      await utils.signature.getOrder.invalidate({ orderId });
    },
  });
  const pdfUrl = trpc.signature.getFinalPdfUrl.useMutation({
    onSuccess: (result) => {
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
    setForm((current) => ({ ...current, [key]: value }));
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
      <section className="min-h-screen px-5 py-14 md:px-10" style={{ background: C.bg }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.32em]" style={{ color: C.gold }}>
              Signature Intake
            </div>
            <h1 className="mt-4 font-serif text-4xl md:text-6xl" style={{ color: C.text, letterSpacing: 0 }}>
              Prepare your letter.
            </h1>
          </div>

          {orderQuery.isLoading ? (
            <div className="flex items-center gap-3" style={{ color: C.muted }}>
              <Loader2 className="animate-spin" size={18} />
              Loading order...
            </div>
          ) : orderQuery.error ? (
            <div className="border p-5 text-sm" style={{ borderColor: "rgba(201,68,68,0.45)", color: "#f1b5a8" }}>
              {orderQuery.error.message}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
              <aside className="border p-5" style={{ borderColor: C.border, background: C.panel }}>
                <div className="text-sm uppercase tracking-[0.2em]" style={{ color: C.gold }}>
                  Order #{orderId}
                </div>
                <div className="mt-4 text-sm" style={{ color: C.muted }}>
                  Status: <span style={{ color: C.text }}>{status}</span>
                </div>
                <p className="mt-5 text-sm leading-7" style={{ color: C.muted }}>
                  Your intake gives ORIEL the exact birth data and the human
                  context needed for founder curation. The final PDF is not
                  auto-delivered from the engine output.
                </p>

                {canDownload && (
                  <button
                    type="button"
                    onClick={() => pdfUrl.mutate({ orderId })}
                    className="mt-6 inline-flex w-full items-center justify-center gap-3 border px-4 py-3 text-xs uppercase tracking-[0.2em]"
                    style={{ borderColor: C.border, color: C.gold }}
                  >
                    <Download size={15} />
                    Open final PDF
                  </button>
                )}
              </aside>

              {orderQuery.data?.intake && status !== "intake_needed" ? (
                <div className="border p-8" style={{ borderColor: C.border, background: C.panel }}>
                  <CheckCircle2 size={34} style={{ color: C.gold }} />
                  <h2 className="mt-5 font-serif text-3xl" style={{ color: C.text }}>
                    Intake received.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7" style={{ color: C.muted }}>
                    Your Signature Letter is awaiting founder curation. You can
                    return here after delivery to access the final PDF.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="border p-6 md:p-8" style={{ borderColor: C.border, background: C.panel }}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Name"><Input value={form.name} onChange={(v) => set("name", v)} required /></Field>
                    <Field label="Email"><Input type="email" value={form.email} onChange={(v) => set("email", v)} required /></Field>
                    <Field label="Birth date"><Input type="date" value={form.birthDate} onChange={(v) => set("birthDate", v)} required /></Field>
                    <Field label="Birth time"><Input type="time" value={form.birthTime} onChange={(v) => set("birthTime", v)} required /></Field>
                    <Field label="Birth place"><Input value={form.birthPlace} onChange={(v) => set("birthPlace", v)} required /></Field>
                    <Field label="Birth country"><Input value={form.birthCountry} onChange={(v) => set("birthCountry", v)} required /></Field>
                    <Field label="Timezone"><Input value={form.timezone} onChange={(v) => set("timezone", v)} placeholder="Europe/Bucharest" required /></Field>
                    <Field label="Preferred tone">
                      <select
                        value={form.preferredTone}
                        onChange={(event) => set("preferredTone", event.target.value as typeof form.preferredTone)}
                        className="h-11 border bg-transparent px-3 text-sm"
                        style={{ borderColor: C.border, color: C.text }}
                      >
                        <option value="mystical">Mystical</option>
                        <option value="practical">Practical</option>
                        <option value="balanced">Balanced</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Focus question">
                    <TextArea value={form.focusQuestion} onChange={(v) => set("focusQuestion", v)} required />
                  </Field>
                  <Field label="What should ORIEL avoid assuming?">
                    <TextArea value={form.avoidAssumptions} onChange={(v) => set("avoidAssumptions", v)} />
                  </Field>

                  <label className="mt-5 flex items-start gap-3 text-sm leading-6" style={{ color: C.muted }}>
                    <input
                      type="checkbox"
                      checked={form.consentAccepted}
                      onChange={(event) => set("consentAccepted", event.target.checked)}
                      className="mt-1"
                      required
                    />
                    I consent to ORIEL using this birth and intake data to prepare
                    a symbolic Signature Letter. I understand this is not medical,
                    legal, therapeutic, financial, or predictive guidance.
                  </label>

                  <button
                    type="submit"
                    disabled={!canSubmit || submitIntake.isPending}
                    className="mt-7 inline-flex items-center justify-center gap-3 border px-6 py-4 text-sm uppercase tracking-[0.22em] disabled:opacity-50"
                    style={{ borderColor: C.border, color: C.gold }}
                  >
                    {submitIntake.isPending ? "Submitting..." : "Submit intake"}
                  </button>

                  {submitIntake.error && (
                    <div className="mt-4 text-sm" style={{ color: "#f1b5a8" }}>
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
    <label className="mt-4 block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.2em]" style={{ color: C.gold }}>
        {label}
      </span>
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
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full border bg-transparent px-3 text-sm outline-none"
      style={{ borderColor: C.border, color: C.text }}
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
      onChange={(event) => onChange(event.target.value)}
      rows={5}
      className="w-full border bg-transparent px-3 py-3 text-sm leading-6 outline-none"
      style={{ borderColor: C.border, color: C.text }}
    />
  );
}
