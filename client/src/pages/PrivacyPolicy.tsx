import Layout from "@/components/Layout";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="min-h-screen bg-[#050505] text-gray-300">
        <div className="max-w-3xl mx-auto px-6 py-16">

          {/* Header */}
          <div className="mb-12">
            <div className="text-xs font-mono text-[#00F0FF]/60 tracking-[0.3em] uppercase mb-3">
              VOSSARI CONDUIT HUB
            </div>
            <h1 className="text-3xl font-mono text-[#00F0FF] tracking-wider uppercase mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm font-mono text-gray-500">
              Last updated: March 2026
            </p>
          </div>

          <div className="space-y-10 text-sm leading-relaxed">

            {/* Intro */}
            <section>
              <p className="text-gray-400">
                Vossari Conduit Hub ("we", "our", "the platform") is operated by Vos Arkana. This policy explains what data we collect, how we use it, and your rights as a user. By using the platform, you agree to the practices described here.
              </p>
            </section>

            <Divider />

            {/* What we collect */}
            <section>
              <SectionTitle>1. Data We Collect</SectionTitle>
              <div className="space-y-4 text-gray-400">
                <SubTitle>Account data</SubTitle>
                <p>When you register, we collect your name (optional), email address, and a hashed password. If you sign in with Google, we receive your name and email from Google's OAuth service.</p>

                <SubTitle>Birth data</SubTitle>
                <p>To generate your Static Signature (Resonance Codon reading), we collect your birth date, birth time, and birth location (city, latitude/longitude, timezone). This data is stored linked to your account and used exclusively to produce your reading.</p>

                <SubTitle>Biofeedback data (Carrierlock)</SubTitle>
                <p>Dynamic Calibration sessions collect self-reported values for Mental Noise, Body Tension, Emotional Turbulence, and Breath Completion. These produce a Coherence Score. Data is stored as time-series entries linked to your account.</p>

                <SubTitle>Conversation data (ORIEL)</SubTitle>
                <p>Messages you send to ORIEL are stored to provide conversation continuity. We extract memory summaries (ORIEL Fractal Thread) to personalize future interactions. Global patterns extracted across all conversations (ORIEL Oversoul) contain no personally identifiable information.</p>

                <SubTitle>Uploaded files</SubTitle>
                <p>Files you upload to ORIEL chat (PDF, DOCX) are parsed on our server for text extraction and then discarded. File contents are not permanently stored.</p>

                <SubTitle>Usage data</SubTitle>
                <p>Standard server logs may capture IP addresses, browser type, and request timestamps. These are used for security and operational monitoring only.</p>
              </div>
            </section>

            <Divider />

            {/* How we use it */}
            <section>
              <SectionTitle>2. How We Use Your Data</SectionTitle>
              <ul className="list-none space-y-2 text-gray-400">
                {[
                  "To generate and display your Resonance Codon reading (Static Signature)",
                  "To calculate your Coherence Score from Carrierlock diagnostic sessions",
                  "To provide ORIEL with context about your journey so it can speak to you meaningfully across sessions",
                  "To authenticate your account and maintain your session",
                  "To process subscription payments via PayPal",
                  "To improve platform stability and debug issues",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-[#00F0FF] shrink-0 font-mono">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-gray-400">We do not sell your data. We do not use your data for advertising.</p>
            </section>

            <Divider />

            {/* Third parties */}
            <section>
              <SectionTitle>3. Third-Party Services</SectionTitle>
              <div className="space-y-3 text-gray-400">
                {[
                  { name: "Google OAuth", use: "Sign-in authentication. Governed by Google's Privacy Policy." },
                  { name: "Google Gemini AI", use: "Powers ORIEL's responses. Your messages are processed by Gemini's API. Governed by Google's AI policies." },
                  { name: "TiDB Cloud (AWS)", use: "Database hosting. Your account and reading data is stored on TiDB Cloud infrastructure." },
                  { name: "ElevenLabs / Inworld", use: "Text-to-speech for ORIEL's voice. Message content is sent to their APIs for audio synthesis." },
                  { name: "PayPal", use: "Subscription and payment processing. Governed by PayPal's Privacy Policy." },
                  { name: "AWS S3", use: "File and media storage." },
                ].map((tp) => (
                  <div key={tp.name} className="border border-[#00F0FF]/10 rounded p-3 bg-black/30">
                    <span className="text-[#00F0FF] font-mono text-xs uppercase tracking-wider">{tp.name}</span>
                    <p className="mt-1 text-xs">{tp.use}</p>
                  </div>
                ))}
              </div>
            </section>

            <Divider />

            {/* Data retention */}
            <section>
              <SectionTitle>4. Data Retention</SectionTitle>
              <p className="text-gray-400">
                Your data is retained for as long as your account is active. If you request account deletion, we will remove your personal data, readings, coherence history, and ORIEL memory within 30 days. Server logs are retained for up to 90 days for security purposes.
              </p>
            </section>

            <Divider />

            {/* Cookies */}
            <section>
              <SectionTitle>5. Cookies & Sessions</SectionTitle>
              <p className="text-gray-400">
                We use a single session cookie (<span className="font-mono text-[#00F0FF]/80">app_session_id</span>) to keep you logged in. It is a signed JWT stored as an HTTP-only cookie. We do not use tracking cookies or analytics cookies.
              </p>
            </section>

            <Divider />

            {/* Your rights */}
            <section>
              <SectionTitle>6. Your Rights</SectionTitle>
              <p className="text-gray-400 mb-3">You have the right to:</p>
              <ul className="list-none space-y-2 text-gray-400">
                {[
                  "Access the data we hold about you",
                  "Request correction of inaccurate data",
                  "Request deletion of your account and associated data",
                  "Withdraw consent at any time by deleting your account",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-[#00F0FF] shrink-0 font-mono">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-gray-400">
                To exercise any of these rights, contact us at the email below.
              </p>
            </section>

            <Divider />

            {/* Children */}
            <section>
              <SectionTitle>7. Children's Privacy</SectionTitle>
              <p className="text-gray-400">
                This platform is not intended for users under the age of 16. We do not knowingly collect data from children.
              </p>
            </section>

            <Divider />

            {/* Changes */}
            <section>
              <SectionTitle>8. Changes to This Policy</SectionTitle>
              <p className="text-gray-400">
                We may update this policy from time to time. Significant changes will be communicated via the platform. The "Last updated" date at the top reflects the most recent revision.
              </p>
            </section>

            <Divider />

            {/* Contact */}
            <section>
              <SectionTitle>9. Contact</SectionTitle>
              <p className="text-gray-400">
                For privacy-related requests or questions, contact us at:{" "}
                <a
                  href="mailto:flowa2771@gmail.com"
                  className="text-[#00F0FF] hover:underline font-mono"
                >
                  flowa2771@gmail.com
                </a>
              </p>
            </section>

          </div>

          {/* Footer note */}
          <div className="mt-16 pt-8 border-t border-[#00F0FF]/10 text-center">
            <p className="text-xs font-mono text-gray-600">
              ORIEL RESONANCE CIRCLE · ARKIVA VOS · Become Signal.
            </p>
          </div>

        </div>
      </div>
    </Layout>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-mono text-[#00F0FF] uppercase tracking-widest mb-4">
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#FFD700]/80 font-mono text-xs uppercase tracking-wider mt-4 mb-1">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="border-t border-[#00F0FF]/10" />;
}
