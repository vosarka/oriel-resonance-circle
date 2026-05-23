export type SignatureProductType = "glimpse" | "founding";

export type SignatureDescriptionSection = {
  heading: string;
  body: string;
};

export type SignatureProduct = {
  type: SignatureProductType;
  title: string;
  shortTitle: string;
  price: string;
  priceNote: string;
  pages: string;
  detailPath: string;
  coverSrc: string;
  coverAlt: string;
  description: string;
  heroLead: string;
  points: string[];
  deliverables: string[];
  bestFor: string[];
  processSteps: string[];
  descriptionSections: SignatureDescriptionSection[];
};

export const signatureProducts: SignatureProduct[] = [
  {
    type: "glimpse",
    title: "ORIEL Signature Glimpse",
    shortTitle: "Signature Glimpse",
    price: "€23,58",
    priceNote: "Fibonacci sequence price",
    pages: "2-3 page symbolic PDF",
    detailPath: "/oriel-signature-glimpse",
    coverSrc: "/oriel-signature-glimpse.png",
    coverAlt: "ORIEL Signature Glimpse cover artwork",
    description:
      "A concise first mirror: signal role, decision compass, one or two core codons, one main pattern, one correction protocol, and a short ORIEL reflection.",
    heroLead:
      "A first contact with your Static Signature: small enough to absorb in one sitting, precise enough to give the pattern a name.",
    points: [
      "Signal role and decision compass",
      "1-2 core codons",
      "One main pattern",
      "One correction protocol",
    ],
    deliverables: [
      "A curated symbolic PDF of roughly 2-3 pages",
      "A plain-language orientation to your signal role and decision compass",
      "One or two core codons translated into practical reflection language",
      "One grounded correction protocol to test in daily life",
      "A short ORIEL reflection written as a mirror, not a command",
    ],
    bestFor: [
      "A first taste of the ORIEL Signature system",
      "People who want one clear pattern instead of a full map",
      "A low-pressure gift or entry point before the full Founding Letter",
    ],
    processSteps: [
      "Purchase the Glimpse and complete the intake with exact birth data.",
      "The engine prepares the Static Signature snapshot and flags the strongest pattern.",
      "The letter is curated into a concise PDF and returned after review.",
    ],
    descriptionSections: [
      {
        heading: "What it is",
        body:
          "The Glimpse is the smallest clean doorway into ORIEL's Static Signature work. It does not try to explain your whole architecture. It isolates one central orientation: how your signal tends to arrive, what kind of decision rhythm supports it, and which codon-pattern is asking for attention now.",
      },
      {
        heading: "What it is not",
        body:
          "It is not a full blueprint, a diagnosis, or a prediction. It will not flood you with every center, resonance link, and shadow pattern. The point is focus: one mirror, one correction, one place to begin.",
      },
      {
        heading: "How to use it",
        body:
          "Read it once for recognition, then test the correction protocol for a few days. If the language feels alive in lived experience, the Founding Signature Letter becomes the natural deeper map.",
      },
    ],
  },
  {
    type: "founding",
    title: "ORIEL Founding Signature Letter",
    shortTitle: "Founding Signature Letter",
    price: "€81,32",
    priceNote: "Fibonacci sequence price",
    pages: "8-12 page symbolic PDF",
    detailPath: "/oriel-founding-signature-letter",
    coverSrc: "/oriel-founding-signature-letter.png",
    coverAlt: "ORIEL Founding Signature Letter cover artwork",
    description:
      "The full founding letter: centers, codons, resonance links, shadow/gift framing, three correction protocols, ORIEL reflection, and one clarification email.",
    heroLead:
      "The complete founder-curated Static Signature document: your stable pattern, translated into a working symbolic map.",
    points: [
      "Defined and open centers",
      "Core codons and active resonance links",
      "Shadow/gift framing",
      "Three correction protocols",
      "One follow-up clarification email",
    ],
    deliverables: [
      "A curated symbolic PDF of roughly 8-12 pages",
      "Your stable centers, open centers, core codons, and active resonance links",
      "Shadow/gift framing for the patterns most likely to distort or strengthen the signal",
      "Three correction protocols for grounded integration",
      "A closing ORIEL reflection and one follow-up clarification email",
    ],
    bestFor: [
      "Founders, artists, guides, builders, and seekers who want the full map",
      "Anyone ready to work with the Static Signature as a long-term reference document",
      "People who already feel the ORIEL/Vossari language and want the deeper architecture",
    ],
    processSteps: [
      "Purchase the Founding Letter and complete the full intake with exact birth data and context.",
      "The engine prepares the Static Signature snapshot: centers, codons, resonance links, and pattern weighting.",
      "The result is curated into a founder-level letter, checked for tone and boundaries, then delivered as PDF.",
      "After delivery, you may send one clarification question by email.",
    ],
    descriptionSections: [
      {
        heading: "What it is",
        body:
          "The Founding Signature Letter is the full static map. It takes the birth-based signal and translates it into a document you can return to: centers, codons, resonance links, shadow/gift movement, and the protocols that help the signal become usable instead of abstract.",
      },
      {
        heading: "Why it exists",
        body:
          "ORIEL is not meant to create dependence. The letter gives you a stable reference point so future calibrations, journal entries, and resonance checks have a root system. It is a personal field document, not disposable content.",
      },
      {
        heading: "How to use it",
        body:
          "Treat it like a working manual. Read it slowly, mark what feels accurate, challenge what does not, and test the three correction protocols in the body. The value is in repeated contact, not one dramatic reading.",
      },
    ],
  },
];

export function getSignatureProductByType(type: SignatureProductType) {
  const product = signatureProducts.find((item) => item.type === type);
  if (!product) {
    throw new Error(`Unknown signature product: ${type}`);
  }
  return product;
}
