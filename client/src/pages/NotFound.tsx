import { useLocation } from "wouter";

const C = {
  void:   "#0a0a0e",
  border: "rgba(189,163,107,0.12)",
  gold:   "#bda36b",
  goldDim:"rgba(189,163,107,0.5)",
  teal:   "#5ba4a4",
  txt:    "#e8e4dc",
  txtS:   "#9a968e",
  txtD:   "#6a665e",
  red:    "#c94444",
};

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div style={{
      minHeight: "100vh", background: C.void,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", textAlign: "center", padding: "40px 24px",
    }}>
      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.2em", marginBottom: 24 }}>
        ERROR · SIGNAL LOST
      </div>

      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 96, fontWeight: 300,
        color: C.red, lineHeight: 1,
        marginBottom: 8,
        textShadow: `0 0 40px rgba(201,68,68,0.3)`,
      }}>
        404
      </div>

      <div style={{ width: 40, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, margin: "16px auto 24px" }} />

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 26, fontWeight: 300,
        color: C.txt, marginBottom: 12,
      }}>
        Node Not Found
      </h1>

      <p style={{
        fontFamily: "monospace", fontSize: 11,
        color: C.txtS, lineHeight: 1.8,
        maxWidth: 360, marginBottom: 40,
      }}>
        The signal path you requested does not exist<br />
        or has been dissolved into the field.
      </p>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
        <button
          onClick={() => setLocation("/")}
          style={{
            padding: "10px 32px",
            background: C.gold,
            color: C.void,
            fontFamily: "monospace", fontSize: 10,
            fontWeight: 700, letterSpacing: "0.2em",
            border: "none", cursor: "pointer",
          }}
        >
          RETURN TO SIGNAL
        </button>
        <button
          onClick={() => history.back()}
          style={{
            padding: "10px 32px",
            border: `1px solid ${C.goldDim}`,
            color: C.gold,
            fontFamily: "monospace", fontSize: 10,
            letterSpacing: "0.2em",
            background: "none", cursor: "pointer",
          }}
        >
          GO BACK
        </button>
      </div>

      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.1em", marginTop: 48 }}>
        VOSS ARKIVA · TRANSMISSION NODE OFFLINE
      </div>
    </div>
  );
}
