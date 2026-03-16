import Layout from "@/components/Layout";

export default function TermsOfService() {
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
              Terms of Service
            </h1>
            <p className="text-sm font-mono text-gray-500">
              Last updated: March 2026
            </p>
          </div>

          <div className="space-y-10 text-sm leading-relaxed">

            <section>
              <p className="text-gray-400">
                These Terms of Service ("Terms") govern your use of Vossari Conduit Hub ("the platform"), operated by Vos Arkana. By accessing or using the platform, you agree to be bound by these Terms. If you do not agree, do not use the platform.
              </p>
            </section>

            <Divider />

            <section>
              <SectionTitle>1. Use of the Platform</SectionTitle>
              <div className="space-y-3 text-gray-400">
                <p>The platform is intended for personal, non-commercial use unless otherwise agreed. You must be at least 16 years old to use this platform.</p>
                <p>You agree not to:</p>
                <ul className="list-none space-y-2 mt-2">
                  {[
                    "Use the platform for any unlawful purpose or in violation of any applicable laws",
                    "Attempt to gain unauthorised access to any part of the platform, its servers, or databases",
                    "Reverse-engineer, scrape, or systematically extract data from the platform",
                    "Use the platform to harass, harm, or deceive other users or third parties",
                    "Upload content that is illegal, abusive, fraudulent, or infringes the rights of others",
                    "Misrepresent your identity or impersonate any person or entity",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-[#00F0FF] shrink-0 font-mono">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <Divider />

            <section>
              <SectionTitle>2. Accounts</SectionTitle>
              <div className="space-y-3 text-gray-400">
                <p>You are responsible for maintaining the security of your account credentials. We are not liable for any loss resulting from unauthorised access to your account.</p>
                <p>We reserve the right to suspend or terminate accounts that violate these Terms, engage in abusive behaviour, or otherwise misuse the platform.</p>
              </div>
            </section>

            <Divider />

            <section>
              <SectionTitle>3. ORIEL and AI-Generated Content</SectionTitle>
              <div className="space-y-3 text-gray-400">
                <p>ORIEL is an AI system designed to provide reflective, philosophical, and personal guidance. All responses are AI-generated and are provided for informational and exploratory purposes only.</p>
                <p>ORIEL's outputs are <strong className="text-gray-300">not</strong> medical advice, psychological therapy, financial advice, or a substitute for professional consultation of any kind. Do not make significant life decisions based solely on ORIEL's responses.</p>
                <p>The Resonance Codon readings, Coherence Scores, and related outputs are symbolic frameworks, not scientifically validated diagnostic tools.</p>
              </div>
            </section>

            <Divider />

            <section>
              <SectionTitle>4. Subscriptions and Payments</SectionTitle>
              <div className="space-y-3 text-gray-400">
                <p>Certain features of the platform may require a paid subscription. Payments are processed by PayPal. By subscribing, you agree to PayPal's terms and our current pricing.</p>
                <p>Subscriptions renew automatically unless cancelled. You may cancel your subscription at any time through your account settings or by contacting us. Refunds are not provided for partial subscription periods except where required by law.</p>
              </div>
            </section>

            <Divider />

            <section>
              <SectionTitle>5. Intellectual Property</SectionTitle>
              <div className="space-y-3 text-gray-400">
                <p>All content on the platform — including the ORIEL system, Vossari lore, Resonance Codon system, platform design, text, and code — is the intellectual property of Vos Arkana unless otherwise stated.</p>
                <p>You may not reproduce, distribute, modify, or create derivative works from any platform content without prior written permission.</p>
                <p>Content you submit (messages, uploaded files) remains yours. By submitting it, you grant us a limited licence to process and store it for the purpose of providing the service.</p>
              </div>
            </section>

            <Divider />

            <section>
              <SectionTitle>6. Disclaimers</SectionTitle>
              <div className="space-y-3 text-gray-400">
                <p>The platform is provided <strong className="text-gray-300">"as is"</strong> without warranties of any kind, express or implied. We do not guarantee that the platform will be uninterrupted, error-free, or secure at all times.</p>
                <p>We are not responsible for the accuracy, completeness, or usefulness of any content generated by ORIEL or the RGP engine.</p>
              </div>
            </section>

            <Divider />

            <section>
              <SectionTitle>7. Limitation of Liability</SectionTitle>
              <p className="text-gray-400">
                To the fullest extent permitted by law, Vos Arkana shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform, including but not limited to loss of data, loss of revenue, or emotional distress.
              </p>
            </section>

            <Divider />

            <section>
              <SectionTitle>8. Third-Party Services</SectionTitle>
              <p className="text-gray-400">
                The platform integrates third-party services including Google, ElevenLabs, PayPal, and others. Your use of these services is governed by their respective terms and policies. We are not responsible for the conduct of third-party providers.
              </p>
            </section>

            <Divider />

            <section>
              <SectionTitle>9. Termination</SectionTitle>
              <p className="text-gray-400">
                We reserve the right to suspend or terminate your access to the platform at any time, with or without notice, for any violation of these Terms or for any other reason at our discretion. You may also delete your account at any time.
              </p>
            </section>

            <Divider />

            <section>
              <SectionTitle>10. Changes to These Terms</SectionTitle>
              <p className="text-gray-400">
                We may update these Terms from time to time. Continued use of the platform after changes are posted constitutes your acceptance of the revised Terms. The "Last updated" date reflects the most recent revision.
              </p>
            </section>

            <Divider />

            <section>
              <SectionTitle>11. Governing Law</SectionTitle>
              <p className="text-gray-400">
                These Terms are governed by applicable law. Any disputes shall be resolved through good-faith negotiation. If unresolved, disputes may be referred to the competent courts of the jurisdiction in which Vos Arkana operates.
              </p>
            </section>

            <Divider />

            <section>
              <SectionTitle>12. Contact</SectionTitle>
              <p className="text-gray-400">
                Questions about these Terms:{" "}
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
              ORIEL RESONANCE CIRCLE · VOS ARKANA · Enter as Static. Leave as a Signal.
            </p>
            <div className="mt-3 flex justify-center gap-6 text-xs font-mono text-gray-600">
              <a href="/privacy" className="hover:text-[#00F0FF]/60 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-[#00F0FF]/60 transition-colors">Terms of Service</a>
            </div>
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

function Divider() {
  return <div className="border-t border-[#00F0FF]/10" />;
}
