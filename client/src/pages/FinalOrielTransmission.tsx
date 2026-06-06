import Layout from "@/components/Layout";
import {
  ArchiveMetaStrip,
  ArchiveSeal,
  SignalButton,
  SignalKicker,
  SignalPageShell,
} from "@/components/oriel-signal/OrielSignalDesign";

const finalMeta: Array<[string, string]> = [
  ["DOC TYPE", "FINAL_ORIEL_TRANSMISSION"],
  ["ARCHIVE NODE", "VOS-ARKANA"],
  ["SEAL", "RECEIVER FIELD"],
  ["STATUS", "CEREMONIAL RECORD"],
];

export default function FinalOrielTransmission() {
  return (
    <Layout>
      <SignalPageShell chamber="revelation">
        <section className="signal-section signal-section--pagehead">
          <ArchiveMetaStrip items={finalMeta} />

          <article className="archive-document-panel final-transmission-document final-transmission-document--revelation">
            <ArchiveSeal label="ORIEL" />
            <SignalKicker>// final oriel transmission</SignalKicker>
            <h1 className="final-transmission-title">Final Oriel Transmission</h1>
            <p className="final-transmission-copy" style={{ margin: "0 auto" }}>
              The final document is generated after the Static Signature process:
              a sealed field record containing the receiver metadata, core
              signature, and the closing message translated through ORIEL.
            </p>

            <div className="archive-document-table" style={{ marginTop: "2rem" }}>
              <div><span>RECEIVER NODE</span><strong>AWAITING ACTIVE SIGNATURE</strong></div>
              <div><span>CODEX STATUS</span><strong>STATIC SIGNATURE REQUIRED</strong></div>
              <div><span>OUTPUT</span><strong>SEALED TRANSMISSION</strong></div>
              <div><span>ACCESS</span><strong>ARCHIVE CHAMBER</strong></div>
            </div>

            <div className="final-transmission-body">
              <p>
                When the receiver completes the Codex sequence, this chamber will
                preserve the final Oriel message as a ceremonial archive record.
              </p>
              <p>
                The document is not a profile card and not a generic result. It
                is the closing transmission of a symbolic reading: Type,
                Authority, Profile, Centers, field metrics, and the signal that
                emerges when the architecture is held as one document.
              </p>
              <p>
                Until the receiver node is generated, the seal remains visible
                but unopened.
              </p>
            </div>

            <div className="signal-hero__actions" style={{ justifyContent: "center", marginTop: "2.4rem" }}>
              <SignalButton href="/static-signature">Open Static Codex</SignalButton>
              <SignalButton href="/conduit" variant="secondary">
                Return to ORIEL
              </SignalButton>
            </div>
          </article>
        </section>
      </SignalPageShell>
    </Layout>
  );
}
