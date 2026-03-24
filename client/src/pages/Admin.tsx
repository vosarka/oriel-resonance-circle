import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import Layout from "@/components/Layout";
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";

// ─── Design Tokens ──────────────────────────────────────────────────────────

const C = {
  void:    "#0a0a0e",
  deep:    "#0f0f15",
  surface: "#14141c",
  border:  "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.25)",
  gold:    "#bda36b",
  goldDim: "rgba(189,163,107,0.5)",
  goldGlow:"rgba(189,163,107,0.08)",
  teal:    "#5ba4a4",
  cyan:    "#00F0FF",
  txt:     "#e8e4dc",
  txtS:    "#9a968e",
  txtD:    "#6a665e",
  red:     "#c94444",
  green:   "#44a866",
};

const CHANNEL_STATUSES = [
  "OPEN", "RESONANT", "COHERENT", "PROPHETIC", "LIVE",
  "STABLE", "HIGH COHERENCE", "MAXIMUM COHERENCE", "CRITICAL / STABLE",
] as const;

const TX_STATUSES = ["Draft", "Confirmed", "Deprecated", "Mythic"] as const;

const CYCLES = ["FOUNDATION ARC", "DAILY FIELD", "LIVING CODEX", "ORACLE STREAM"] as const;

// ─── Form State ─────────────────────────────────────────────────────────────

interface TxFormData {
  title: string;
  field: string;
  coreMessage: string;
  tags: string;
  microSigil: string;
  signalClarity: string;
  channelStatus: typeof CHANNEL_STATUSES[number];
  encodedArchetype: string;
  leftPanelPrompt: string;
  centerPanelPrompt: string;
  rightPanelPrompt: string;
  hashtags: string;
  cycle: string;
  status: typeof TX_STATUSES[number];
}

const EMPTY_FORM: TxFormData = {
  title: "",
  field: "",
  coreMessage: "",
  tags: "",
  microSigil: "◈",
  signalClarity: "98.7%",
  channelStatus: "OPEN",
  encodedArchetype: "",
  leftPanelPrompt: "",
  centerPanelPrompt: "",
  rightPanelPrompt: "",
  hashtags: "",
  cycle: "FOUNDATION ARC",
  status: "Confirmed",
};

// ─── Field Input ────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label style={{ color: C.txtS, fontSize: 12, fontFamily: "'Red Hat Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}{required && <span style={{ color: C.gold }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: C.void,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: "8px 12px",
        color: C.txt,
        fontSize: 14,
        fontFamily: "'Red Hat Mono', monospace",
        outline: "none",
      }}
      onFocus={(e) => (e.target.style.borderColor = C.gold)}
      onBlur={(e) => (e.target.style.borderColor = C.border as string)}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        background: C.void,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: "8px 12px",
        color: C.txt,
        fontSize: 14,
        fontFamily: "'Red Hat Mono', monospace",
        outline: "none",
        resize: "vertical",
      }}
      onFocus={(e) => (e.target.style.borderColor = C.gold)}
      onBlur={(e) => (e.target.style.borderColor = C.border as string)}
    />
  );
}

function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly T[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      style={{
        background: C.void,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: "8px 12px",
        color: C.txt,
        fontSize: 14,
        fontFamily: "'Red Hat Mono', monospace",
        outline: "none",
      }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

// ─── Transmission Form Modal ────────────────────────────────────────────────

function TxForm({ initial, onSubmit, onCancel, isLoading }: {
  initial: TxFormData;
  onSubmit: (data: TxFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<TxFormData>(initial);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const set = <K extends keyof TxFormData>(key: K, val: TxFormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const canSubmit = form.title && form.field && form.coreMessage && form.tags && form.microSigil;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: C.deep,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          maxWidth: 720,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: 32,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ color: C.gold, fontFamily: "'Cinzel', serif", fontSize: 20 }}>
            {initial.title ? "Edit Transmission" : "New Transmission"}
          </h2>
          <button onClick={onCancel} style={{ color: C.txtD, cursor: "pointer", background: "none", border: "none" }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Core fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title" required>
              <TextInput value={form.title} onChange={(v) => set("title", v)} placeholder="THE PRIMORDIAL VIBRATION" />
            </Field>
            <Field label="Field" required>
              <TextInput value={form.field} onChange={(v) => set("field", v)} placeholder="Quantum Cosmology · Sacred Geometry" />
            </Field>
          </div>

          <Field label="Core Message" required>
            <TextArea value={form.coreMessage} onChange={(v) => set("coreMessage", v)} placeholder="The core philosophical teaching..." rows={6} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Tags" required>
              <TextInput value={form.tags} onChange={(v) => set("tags", v)} placeholder="void, vibration, genesis" />
            </Field>
            <Field label="Micro Sigil" required>
              <TextInput value={form.microSigil} onChange={(v) => set("microSigil", v)} placeholder="◈" />
            </Field>
            <Field label="Signal Clarity">
              <TextInput value={form.signalClarity} onChange={(v) => set("signalClarity", v)} placeholder="98.7%" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Channel Status">
              <Select value={form.channelStatus} onChange={(v) => set("channelStatus", v)} options={CHANNEL_STATUSES} />
            </Field>
            <Field label="Cycle">
              <Select value={form.cycle as typeof CYCLES[number]} onChange={(v) => set("cycle", v)} options={CYCLES} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(v) => set("status", v)} options={TX_STATUSES} />
            </Field>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 self-start"
            style={{ background: "none", border: "none", color: C.txtS, cursor: "pointer", fontSize: 13, fontFamily: "'Red Hat Mono', monospace" }}
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAdvanced ? "Hide" : "Show"} advanced fields
          </button>

          {showAdvanced && (
            <div className="flex flex-col gap-4">
              <Field label="Encoded Archetype">
                <TextArea value={form.encodedArchetype} onChange={(v) => set("encodedArchetype", v)} placeholder="Archetypal pattern..." rows={3} />
              </Field>
              <Field label="Hashtags">
                <TextInput value={form.hashtags} onChange={(v) => set("hashtags", v)} placeholder="#VossariWisdom #CosmicResonance" />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Left Panel Prompt">
                  <TextArea value={form.leftPanelPrompt} onChange={(v) => set("leftPanelPrompt", v)} rows={3} />
                </Field>
                <Field label="Center Panel Prompt">
                  <TextArea value={form.centerPanelPrompt} onChange={(v) => set("centerPanelPrompt", v)} rows={3} />
                </Field>
                <Field label="Right Panel Prompt">
                  <TextArea value={form.rightPanelPrompt} onChange={(v) => set("rightPanelPrompt", v)} rows={3} />
                </Field>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={onCancel}
              style={{
                padding: "10px 24px",
                background: "transparent",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                color: C.txtS,
                cursor: "pointer",
                fontFamily: "'Red Hat Mono', monospace",
                fontSize: 13,
              }}
            >
              CANCEL
            </button>
            <button
              onClick={() => canSubmit && onSubmit(form)}
              disabled={!canSubmit || isLoading}
              style={{
                padding: "10px 24px",
                background: canSubmit ? C.gold : C.txtD,
                border: "none",
                borderRadius: 6,
                color: C.void,
                cursor: canSubmit ? "pointer" : "not-allowed",
                fontFamily: "'Red Hat Mono', monospace",
                fontWeight: 700,
                fontSize: 13,
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : initial.title ? "UPDATE" : "TRANSMIT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────────────────────────

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TxFormData>(EMPTY_FORM);

  const utils = trpc.useUtils();
  const { data: transmissions, isLoading } = trpc.admin.transmissions.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const createMut = trpc.admin.transmissions.create.useMutation({
    onSuccess: () => { utils.admin.transmissions.list.invalidate(); setMode("list"); },
  });
  const updateMut = trpc.admin.transmissions.update.useMutation({
    onSuccess: () => { utils.admin.transmissions.list.invalidate(); setMode("list"); setEditId(null); },
  });
  const deleteMut = trpc.admin.transmissions.delete.useMutation({
    onSuccess: () => { utils.admin.transmissions.list.invalidate(); },
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin" style={{ color: C.gold }} />
        </div>
      </Layout>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p style={{ color: C.red, fontFamily: "'Red Hat Mono', monospace", fontSize: 14 }}>
            ▮ ACCESS DENIED — ADMIN CLEARANCE REQUIRED
          </p>
        </div>
      </Layout>
    );
  }

  const handleCreate = (data: TxFormData) => {
    createMut.mutate(data);
  };

  const handleUpdate = (data: TxFormData) => {
    if (editId === null) return;
    updateMut.mutate({ id: editId, ...data });
  };

  const handleEdit = (tx: any) => {
    setEditId(tx.id);
    setEditForm({
      title: tx.title,
      field: tx.field,
      coreMessage: tx.coreMessage,
      tags: tx.tags,
      microSigil: tx.microSigil,
      signalClarity: tx.signalClarity,
      channelStatus: tx.channelStatus,
      encodedArchetype: tx.encodedArchetype || "",
      leftPanelPrompt: tx.leftPanelPrompt || "",
      centerPanelPrompt: tx.centerPanelPrompt || "",
      rightPanelPrompt: tx.rightPanelPrompt || "",
      hashtags: tx.hashtags || "",
      cycle: tx.cycle,
      status: tx.status,
    });
    setMode("edit");
  };

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Delete transmission "${title}"? This cannot be undone.`)) {
      deleteMut.mutate({ id });
    }
  };

  const sorted = [...(transmissions || [])].sort((a, b) => b.txNumber - a.txNumber);

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 style={{ color: C.gold, fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 400 }}>
              TRANSMISSION CONTROL
            </h1>
            <p style={{ color: C.txtS, fontFamily: "'Red Hat Mono', monospace", fontSize: 12, marginTop: 4 }}>
              {sorted.length} transmissions in archive
            </p>
          </div>
          <button
            onClick={() => { setMode("create"); setEditForm(EMPTY_FORM); }}
            className="flex items-center gap-2"
            style={{
              padding: "10px 20px",
              background: C.gold,
              border: "none",
              borderRadius: 6,
              color: C.void,
              cursor: "pointer",
              fontFamily: "'Red Hat Mono', monospace",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <Plus size={16} /> NEW TRANSMISSION
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: C.gold }} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Table header */}
            <div
              className="grid items-center gap-4 px-4 py-2"
              style={{
                gridTemplateColumns: "60px 1fr 180px 100px 100px 80px",
                borderBottom: `1px solid ${C.border}`,
                color: C.txtD,
                fontFamily: "'Red Hat Mono', monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <span>TX#</span>
              <span>TITLE</span>
              <span>FIELD</span>
              <span>STATUS</span>
              <span>CYCLE</span>
              <span style={{ textAlign: "right" }}>ACTIONS</span>
            </div>

            {sorted.map((tx) => (
              <div
                key={tx.id}
                className="grid items-center gap-4 px-4 py-3 group"
                style={{
                  gridTemplateColumns: "60px 1fr 180px 100px 100px 80px",
                  background: C.surface,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.borderH as string)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border as string)}
              >
                <span style={{ color: C.gold, fontFamily: "'Red Hat Mono', monospace", fontSize: 13 }}>
                  {String(tx.txNumber).padStart(3, "0")}
                </span>
                <div>
                  <span style={{ color: C.txt, fontSize: 14 }}>{tx.title}</span>
                  <span style={{ color: C.txtD, fontSize: 12, marginLeft: 8 }}>{tx.microSigil}</span>
                </div>
                <span style={{ color: C.txtS, fontSize: 12, fontFamily: "'Red Hat Mono', monospace" }}>
                  {tx.field.length > 25 ? tx.field.slice(0, 25) + "…" : tx.field}
                </span>
                <span style={{
                  color: tx.status === "Confirmed" ? C.green : tx.status === "Draft" ? C.txtS : tx.status === "Mythic" ? C.gold : C.red,
                  fontSize: 12,
                  fontFamily: "'Red Hat Mono', monospace",
                }}>
                  {tx.status}
                </span>
                <span style={{ color: C.txtD, fontSize: 11, fontFamily: "'Red Hat Mono', monospace" }}>
                  {tx.cycle === "FOUNDATION ARC" ? "FOUND" : tx.cycle.slice(0, 8)}
                </span>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleEdit(tx)}
                    style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", padding: 4 }}
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id, tx.title)}
                    style={{ background: "none", border: "none", color: C.red, cursor: "pointer", padding: 4, opacity: 0.6 }}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {sorted.length === 0 && (
              <div className="flex flex-col items-center py-20 gap-3">
                <p style={{ color: C.txtD, fontFamily: "'Red Hat Mono', monospace", fontSize: 14 }}>
                  No transmissions in the archive yet.
                </p>
                <button
                  onClick={() => { setMode("create"); setEditForm(EMPTY_FORM); }}
                  style={{ color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "'Red Hat Mono', monospace", fontSize: 13 }}
                >
                  Create the first transmission →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {mode === "create" && (
        <TxForm
          initial={EMPTY_FORM}
          onSubmit={handleCreate}
          onCancel={() => setMode("list")}
          isLoading={createMut.isPending}
        />
      )}
      {mode === "edit" && (
        <TxForm
          initial={editForm}
          onSubmit={handleUpdate}
          onCancel={() => { setMode("list"); setEditId(null); }}
          isLoading={updateMut.isPending}
        />
      )}
    </Layout>
  );
}
