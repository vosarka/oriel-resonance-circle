import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Mic,
  Trash2,
  X,
  Pause,
  Play,
  Square,
  Paperclip,
  Plus,
  MessageSquare,
  Menu,
  Phone,
  Radio,
  Image as ImageIcon,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Orb } from "@/components/ui/orb";
import { Spinner } from "@/components/ui/spinner";
import GeometricBackground from "@/components/GeometricBackground";
import VoiceMode from "@/components/VoiceMode";
import {
  SignalInterferenceGate,
  useTransmissionTrigger,
} from "@/components/SignalInterferenceGate";
import MemoryConsentTray from "@/components/memory/MemoryConsentTray";
import {
  getPendingTransmissionPollPlan,
  getTransmissionGatePlan,
} from "@/lib/transmission-gate";
import {
  getConduitInputDisabled,
  getSpeechFallbackTimeoutMs,
  getSpeechFallbackWatchdogDecision,
} from "@/lib/conduit-voice";
import {
  markOrielVoiceIntroSpoken,
  prepareOrielTextForVoice,
} from "@/lib/orielVoiceIntroSession";
import { parseOrielChatImageFromContent } from "@shared/oriel-chat-images";
import { Link } from "wouter";
import "@/components/oriel-signal/oriel-signal.css";

interface ChatAttachment {
  name: string;
  data: string;
  mimeType: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  transmissionEvent?: GeneratedTransmissionEvent | null;
}

type TransmissionRarity = "common" | "uncommon" | "rare" | "mythic" | "void";

interface GeneratedTxPayload {
  txId?: string;
  title: string;
  field: string;
  signalClarity: string;
  channelStatus: string;
  coreMessage: string;
  encodedArchetype: string;
  tags: string[];
  microSigil: string;
  directive: string;
  caption?: string;
  subject?: string | null;
  symbolicLayer?: string | null;
  archiveThemes?: string[];
  emotionalColor?: string | null;
}

interface GeneratedOraclePayload {
  title: string;
  field: string;
  signalClarity: string;
  channelStatus: string;
  parts: Array<{
    part: "Past" | "Present" | "Future";
    field?: string;
    content: string;
    currentFieldSignatures?: string;
    encodedTrajectory: string;
    convergenceZones?: string;
    keyInflectionPoint: string;
    majorOutcomes: string;
    caption?: string;
  }>;
  linkedCodons: string[];
  threadTitle: string | null;
  threadSynthesis: string | null;
}

type GeneratedTransmissionPayload = GeneratedTxPayload | GeneratedOraclePayload;

interface GeneratedTransmissionEvent {
  id: number;
  eventKey: string;
  eventType: "tx" | "oracle";
  rarity: TransmissionRarity;
  meaningLevel: number;
  status: string;
  payload: GeneratedTransmissionPayload;
  createdAt?: string | number | Date;
}

interface PendingTransmission {
  conversationId: number;
  requestedAt: string;
  triggerSource: "oriel.chat";
}

interface SessionTransmissionAttachment {
  conversationId: number | null;
  assistantContent: string;
  event: GeneratedTransmissionEvent;
  createdAt: number;
}

const TRANSMISSION_RARITIES: TransmissionRarity[] = [
  "common",
  "uncommon",
  "rare",
  "mythic",
  "void",
];
const TRANSMISSION_TYPES = ["tx", "oracle"] as const;
type TransmissionCommandType = (typeof TRANSMISSION_TYPES)[number];

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isImageAttachment(attachment: ChatAttachment) {
  return attachment.mimeType.toLowerCase().startsWith("image/");
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function isDuplicateFile(newFile: File, existing: ChatAttachment[]): boolean {
  return existing.some(
    f =>
      f.name === newFile.name &&
      // We don't have original size, so we approximate by name for now
      true
  );
}

function extractImagePrompt(rawMessage: string): string | null {
  const trimmed = rawMessage.trim();
  if (!trimmed) return null;

  // Explicit slash & classic commands (highest priority, exact match)
  const slash = trimmed.match(
    /^\/(?:image|imagine|create-image|draw|gen-image)\b[:\s-]*(.*)$/i
  );
  if (slash) {
    const p = (slash[1] || "").trim();
    return p || trimmed;
  }

  const createImage = trimmed.match(/^create\s+image\s*(?::|of\s+)?\s*(.*)$/i);
  if (createImage) {
    const p = (createImage[1] || "").trim();
    return p || trimmed;
  }

  // Natural-language image intent phrases (from the spec + common variants).
  // We capture the descriptive subject so the generated "Create image: ..." bubble
  // stays clean and the LLM history sees a sensible prompt.
  const natural = [
    // generate / create / make ... image/picture etc.
    /^(?:please\s+)?(?:generate|create|make)\s+(?:an?\s+)?(?:image|picture|drawing|illustration|render|visualization|art|scene)\s*(?::|of\s+|-|\s+)(.*)$/i,
    // draw ...
    /^(?:please\s+)?draw\s+(?:this|me|a|an|the)?\s*(.*)$/i,
    // render ...
    /^(?:please\s+)?render\s+(?:this|the|a|an)?\s*(?:scene|image|view|visual)?\s*(.*)$/i,
    // visualize / visualise
    /^(?:please\s+)?visuali[sz]e\s+(?:this|the|a|an)?\s*(.*)$/i,
    // design an image / a picture
    /^(?:please\s+)?design\s+(?:an?\s+)?(?:image|picture)?\s*(.*)$/i,
    // turn X into an image / picture
    /^turn\s+(?:this|the|my)?\s*(.*)\s+into\s+(?:an?\s+)?(?:image|picture|drawing|illustration|render|visual)\s*$/i,
    // bare "an image of X" / "a picture of X"
    /^(?:an?\s+)?image\s+(?:of\s+)?(.*)$/i,
    /^(?:a\s+)?picture\s+(?:of\s+)?(.*)$/i,
    // imagine ...
    /^imagine\s+(?:a|an|the)?\s*(.*)$/i,
  ];

  for (const re of natural) {
    const m = trimmed.match(re);
    if (m && m[1]) {
      const p = m[1].trim();
      if (p && p.length > 1) return p;
    }
  }

  // Contains check (last resort) for the exact phrases listed in the requirements.
  // If we find one, return everything after it (or the whole message as fallback).
  const lower = trimmed.toLowerCase();
  const intentPhrases = [
    "generate an image",
    "generate a image",
    "generate image",
    "generate this image",
    "create an image",
    "create a image",
    "create image",
    "create this image",
    "make a picture",
    "make an image",
    "make image",
    "draw this",
    "draw me",
    "draw a",
    "draw the",
    "render this scene",
    "render an image",
    "visualize this",
    "visualise this",
    "design an image",
    "turn this into an image",
    "turn that into an image",
    "make this into an image",
  ];

  for (const phrase of intentPhrases) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      let after = trimmed
        .substring(idx + phrase.length)
        .replace(/^[:\s,-]+/, "")
        .trim();
      if (after && after.length > 1) return after;
      return trimmed; // phrase was the whole message or at the end
    }
  }

  return null;
}

// Back-compat wrapper (used by any remaining call sites or tests).
function parseImageCreationCommand(rawMessage: string): string | null {
  return extractImagePrompt(rawMessage);
}

function visibleAssistantText(content: string) {
  return parseOrielChatImageFromContent(content).text.trim();
}

function isGeneratedOraclePayload(
  payload: GeneratedTransmissionPayload
): payload is GeneratedOraclePayload {
  return "parts" in payload;
}

function parseTransmissionCommand(rawMessage: string) {
  if (/^\/clarity\b/i.test(rawMessage)) {
    const userMessage = rawMessage.replace(/^\/clarity\b/i, "").trim();
    return {
      forceTransmissionMode: true,
      userMessage: userMessage || "Open a contextual clarity transmission.",
      forcedTransmissionRarity: "rare" as TransmissionRarity,
      forcedTransmissionType: "tx" as TransmissionCommandType,
      transmissionIntent: "clarity" as const,
    };
  }

  if (!/^\/transmission\b/i.test(rawMessage)) {
    return {
      forceTransmissionMode: false,
      userMessage: rawMessage,
      forcedTransmissionRarity: undefined,
      forcedTransmissionType: undefined,
      transmissionIntent: undefined,
    };
  }

  const words = rawMessage
    .replace(/^\/transmission\b/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let forcedTransmissionRarity: TransmissionRarity | undefined;
  let forcedTransmissionType: TransmissionCommandType | undefined;

  while (words.length > 0) {
    const next = words[0].toLowerCase();
    if (
      !forcedTransmissionRarity &&
      TRANSMISSION_RARITIES.includes(next as TransmissionRarity)
    ) {
      forcedTransmissionRarity = next as TransmissionRarity;
      words.shift();
      continue;
    }
    if (
      !forcedTransmissionType &&
      TRANSMISSION_TYPES.includes(next as TransmissionCommandType)
    ) {
      forcedTransmissionType = next as TransmissionCommandType;
      words.shift();
      continue;
    }
    break;
  }

  return {
    forceTransmissionMode: true,
    userMessage: words.join(" ").trim() || "Open transmission mode.",
    forcedTransmissionRarity,
    forcedTransmissionType,
    transmissionIntent: undefined,
  };
}

function attachSessionTransmissionEvents(
  messages: ChatMessage[],
  attachments: SessionTransmissionAttachment[],
  conversationId: number | null
): ChatMessage[] {
  if (attachments.length === 0) return messages;

  return messages.map(msg => {
    if (msg.role !== "assistant" || msg.transmissionEvent) return msg;

    for (let index = attachments.length - 1; index >= 0; index -= 1) {
      const attachment = attachments[index];
      if (
        attachment.conversationId === conversationId &&
        attachment.assistantContent === msg.content
      ) {
        return {
          ...msg,
          transmissionEvent: attachment.event,
        };
      }
    }

    return msg;
  });
}

function TransmissionModeCard({
  event,
}: {
  event: GeneratedTransmissionEvent;
}) {
  const payload = event.payload;
  const rarityColor: Record<TransmissionRarity, string> = {
    common: "rgba(246,176,94,0.72)",
    uncommon: "rgba(121,255,188,0.78)",
    rare: "rgba(189,163,107,0.86)",
    mythic: "rgba(255,168,96,0.88)",
    void: "rgba(211,126,255,0.88)",
  };
  const accent = rarityColor[event.rarity] ?? "rgba(246,176,94,0.72)";

  return (
    <div
      className="mt-5 rounded-lg px-4 py-4"
      style={{
        background: "rgba(2,12,18,0.72)",
        border: `1px solid ${accent}`,
        boxShadow: "0 0 24px rgba(189,163,107,0.08)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Radio size={14} style={{ color: accent }} />
        <span
          className="font-mono text-[9px] tracking-[0.28em] uppercase"
          style={{ color: accent }}
        >
          Transmission Mode
        </span>
        <span
          className="font-mono text-[9px] tracking-[0.18em] uppercase"
          style={{ color: "rgba(232,228,220,0.55)" }}
        >
          {event.eventType.toUpperCase()} // {event.rarity.toUpperCase()} //
          Meaning {event.meaningLevel}/5
        </span>
      </div>

      <p
        className="font-mono text-[10px] tracking-[0.16em] uppercase mb-2"
        style={{ color: "rgba(232,228,220,0.68)" }}
      >
        {payload.title}
      </p>
      <p
        className="font-mono text-[9px] mb-3"
        style={{ color: "rgba(189,163,107,0.45)" }}
      >
        {payload.field} // {payload.channelStatus} // {payload.signalClarity}
      </p>

      {isGeneratedOraclePayload(payload) ? (
        <div className="space-y-3">
          {payload.parts.map(part => (
            <div key={part.part}>
              <p
                className="font-mono text-[9px] tracking-[0.24em] uppercase mb-1"
                style={{ color: accent }}
              >
                {part.part}
              </p>
              <p
                className="font-mono text-[10px] leading-relaxed whitespace-pre-line"
                style={{ color: "rgba(232,228,220,0.82)" }}
              >
                {part.caption ?? part.content}
              </p>
            </div>
          ))}
          {payload.linkedCodons.length > 0 && (
            <p
              className="font-mono text-[9px]"
              style={{ color: "rgba(189,163,107,0.45)" }}
            >
              Codons: {payload.linkedCodons.join(", ")}
            </p>
          )}
        </div>
      ) : (
        <div>
          {payload.caption ? (
            <p
              className="font-mono text-[10px] leading-relaxed whitespace-pre-line"
              style={{ color: "rgba(232,228,220,0.84)" }}
            >
              {payload.caption}
            </p>
          ) : (
            <>
              <p
                className="text-sm leading-relaxed mb-3"
                style={{ color: "rgba(232,228,220,0.84)" }}
              >
                {payload.coreMessage}
              </p>
              <p
                className="font-mono text-[9px] mb-2"
                style={{ color: "rgba(189,163,107,0.5)" }}
              >
                {payload.encodedArchetype}
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "rgba(189,163,107,0.82)" }}
              >
                {payload.directive}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AssistantMessageView({ msg }: { msg: ChatMessage }) {
  const parsed = parseOrielChatImageFromContent(msg.content);
  const assistantText = parsed.text.trim();
  const hasVisibleContent = Boolean(assistantText || parsed.image);

  return (
    <div
      className={hasVisibleContent ? "pl-5 pr-2 py-1" : "py-1"}
      style={
        hasVisibleContent
          ? { borderLeft: "2px solid rgba(189,163,107,0.3)" }
          : undefined
      }
    >
      {assistantText && (
        <>
          <p
            className="font-mono text-[9px] mb-3 tracking-[0.3em] uppercase"
            style={{ color: "rgba(189,163,107,0.6)" }}
          >
            Transmission
            {msg.timestamp && (
              <span
                className="ml-2 normal-case tracking-normal"
                style={{ color: "rgba(189,163,107,0.35)" }}
              >
                // {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            )}
          </p>
          <p
            className="text-sm leading-relaxed italic whitespace-pre-line"
            style={{ color: "rgba(232,228,220,0.85)" }}
          >
            "{assistantText}"
          </p>
        </>
      )}

      {parsed.image && (
        <div
          className="mt-4 overflow-hidden rounded-lg"
          style={{
            background: "rgba(189,163,107,0.04)",
            border: "1px solid rgba(189,163,107,0.22)",
          }}
        >
          <img
            src={parsed.image.url}
            alt={`Generated ORIEL image: ${parsed.image.prompt}`}
            className="block w-full max-w-xl object-cover"
            loading="lazy"
          />
          <p
            className="px-3 py-2 font-mono text-[9px] leading-relaxed"
            style={{ color: "rgba(246,176,94,0.58)" }}
          >
            Image prompt: {parsed.image.prompt}
          </p>
        </div>
      )}

      {msg.transmissionEvent && (
        <TransmissionModeCard event={msg.transmissionEvent} />
      )}
    </div>
  );
}

export default function Conduit() {
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [voicePreference, setVoicePreference] = useState<
    "sophianic" | "deep" | "none"
  >("sophianic");
  const [isImageMode, setIsImageMode] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("oriel_image_mode") === "true"
  );
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<ChatAttachment[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [sessionTransmissionAttachments, setSessionTransmissionAttachments] =
    useState<SessionTransmissionAttachment[]>([]);
  const transmissionGate = useTransmissionTrigger({ duration: 1200 });
  const trpcUtils = trpc.useUtils();
  const refreshMemoryConsent = () => {
    void trpcUtils.oriel.memory.listPendingCandidates.invalidate();
    void trpcUtils.oriel.memory.listAccepted.invalidate();
  };

  // Web Audio API for TTS playback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const voiceAudioCtxRef = useRef<AudioContext | null>(null);

  // For speech-to-text mic silence monitoring (4s pause auto stop)
  const speechInputStreamRef = useRef<MediaStream | null>(null);
  const speechAnalyserRef = useRef<AnalyserNode | null>(null);
  const speechMonitorIntervalRef = useRef<number | null>(null);
  const lastSpeechSoundRef = useRef<number>(Date.now());
  const isListeningRef = useRef(false);

  // Accumulates finalized speech recognition results across internal restarts
  // so long spoken phrases don't get truncated in the input box.
  const finalTranscriptRef = useRef<string>("");

  // Used so the 4s auto-stop only applies after the user has actually spoken at least once.
  // This prevents the mic from "opening then immediately closing" if the user takes a moment
  // to start speaking or if initial VAD/STT detection is slow.
  const hasSpeechRef = useRef(false);

  const ensureAudioAnalyser = () => {
    if (!audioRef.current) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    const audioCtx = audioCtxRef.current;
    if (!analyserRef.current) {
      analyserRef.current = audioCtx.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
    }
    if (!sourceRef.current) {
      sourceRef.current = audioCtx.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  };

  const openVoiceMode = () => {
    try {
      const AudioContextCtor =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor) {
        const existing = voiceAudioCtxRef.current;
        if (!existing || existing.state === "closed") {
          voiceAudioCtxRef.current = new AudioContextCtor({
            sampleRate: 24000,
          });
        }
        if (voiceAudioCtxRef.current?.state === "suspended") {
          void voiceAudioCtxRef.current.resume().catch(err => {
            console.warn("[VoiceMode] Primed AudioContext resume failed:", err);
          });
        }
      }
    } catch (err) {
      console.warn("[VoiceMode] Could not prime AudioContext:", err);
    }
    // Stop the simple speech-to-text mic if it was on, to avoid double mic capture
    if (isListening) {
      stopSpeechListening();
    }
    setVoiceMode(true);
  };

  // Load local history and voice preference from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("oriel_chat_history");
    if (savedMessages) {
      try {
        setLocalMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }

    const savedVoice = localStorage.getItem("voicePreference");
    if (savedVoice) {
      const mapped =
        savedVoice === "fast"
          ? "sophianic"
          : savedVoice === "nostalgic"
            ? "deep"
            : savedVoice;
      if (mapped === "sophianic" || mapped === "deep" || mapped === "none") {
        setVoicePreference(mapped);
        if (mapped !== savedVoice)
          localStorage.setItem("voicePreference", mapped);
      }
    }
  }, []);

  // Persist image generation mode across reloads (the "persistent mode flag")
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("oriel_image_mode", isImageMode ? "true" : "false");
    }
  }, [isImageMode]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const { data: dbHistory, refetch: refetchHistory } =
    trpc.oriel.getHistory.useQuery(undefined, {
      enabled: isAuthenticated,
      retry: false,
    });

  const { data: conversationsList, refetch: refetchConversations } =
    trpc.oriel.listConversations.useQuery(undefined, {
      enabled: isAuthenticated,
      retry: false,
    });

  const { data: activeConvData, refetch: refetchActiveConv } =
    trpc.oriel.getConversation.useQuery(
      { id: activeConversationId ?? 0 },
      {
        enabled: isAuthenticated && activeConversationId !== null,
        retry: false,
      }
    );

  const pendingMemoryQuery = trpc.oriel.memory.listPendingCandidates.useQuery(
    { limit: 3 },
    { enabled: isAuthenticated, retry: false }
  );
  const acceptedMemoryQuery = trpc.oriel.memory.listAccepted.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated, retry: false }
  );
  const acceptMemoryMutation = trpc.oriel.memory.acceptCandidate.useMutation({
    onSuccess: refreshMemoryConsent,
  });
  const rejectMemoryMutation = trpc.oriel.memory.rejectCandidate.useMutation({
    onSuccess: refreshMemoryConsent,
  });

  const deleteConversationMutation = trpc.oriel.deleteConversation.useMutation({
    onSuccess: () => {
      refetchConversations();
    },
  });

  useEffect(() => {
    if (!isAuthenticated || isNewConversation || activeConversationId !== null)
      return;
    if (!conversationsList || conversationsList.length === 0) return;
    setActiveConversationId(conversationsList[0].id);
  }, [
    isAuthenticated,
    isNewConversation,
    activeConversationId,
    conversationsList,
  ]);

  // Sync localMessages with active conversation or general history
  useEffect(() => {
    if (isAuthenticated && activeConversationId && activeConvData?.messages) {
      const convertedHistory = activeConvData.messages.map(msg => ({
        role: msg.role as ChatMessage["role"],
        content: msg.content,
        timestamp:
          msg.timestamp instanceof Date
            ? msg.timestamp.getTime()
            : (msg.timestamp as number),
      }));
      setLocalMessages(prev => {
        const merged = attachSessionTransmissionEvents(
          convertedHistory,
          sessionTransmissionAttachments,
          activeConversationId
        );
        const hasSessionCard = prev.some(msg => Boolean(msg.transmissionEvent));
        return hasSessionCard && prev.length > merged.length ? prev : merged;
      });
    } else if (
      isAuthenticated &&
      !activeConversationId &&
      !isNewConversation &&
      conversationsList &&
      conversationsList.length === 0 &&
      dbHistory &&
      dbHistory.length > 0
    ) {
      const convertedHistory = dbHistory.map(msg => ({
        role: msg.role as ChatMessage["role"],
        content: msg.content,
        timestamp:
          msg.timestamp instanceof Date
            ? msg.timestamp.getTime()
            : msg.timestamp,
      }));
      setLocalMessages(prev => {
        const merged = attachSessionTransmissionEvents(
          convertedHistory,
          sessionTransmissionAttachments,
          null
        );
        const hasSessionCard = prev.some(msg => Boolean(msg.transmissionEvent));
        return hasSessionCard && prev.length > merged.length ? prev : merged;
      });
    }
  }, [
    isAuthenticated,
    dbHistory,
    activeConvData,
    activeConversationId,
    isNewConversation,
    conversationsList,
    sessionTransmissionAttachments,
  ]);

  const chatMutation = trpc.oriel.chat.useMutation({
    onError: error => {
      console.error("Chat error:", error);
    },
  });
  const generateChatImageMutation = trpc.oriel.generateChatImage.useMutation({
    onError: error => {
      console.error("Chat image generation error:", error);
    },
  });

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        // Accumulate using isFinal results (committed) + trailing interim.
        // We use event.resultIndex and loop to respect the standard API and
        // only process new results in this event. The finalTranscriptRef
        // persists across our internal restarts (onend retries) so a long
        // spoken phrase like "hello, how are you today, you are good?" does
        // not lose the beginning when the browser ends/restarts the recognizer.
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalTranscriptRef.current = finalTranscriptRef.current
              ? finalTranscriptRef.current + " " + text
              : text;
          } else {
            interim = text;
          }
        }

        const full = interim
          ? finalTranscriptRef.current
            ? finalTranscriptRef.current + " " + interim
            : interim
          : finalTranscriptRef.current;

        setMessage(full.trim());
        lastSpeechSoundRef.current = Date.now();
        hasSpeechRef.current = true;
        // Do NOT setIsListening(false) here — we control it via toggle or silence timer
      };

      // Also treat speech results as "sound" to reset silence in monitor
      // (the monitor will also catch via RMS)

      recognitionRef.current.onerror = (e?: any) => {
        // Never clear the logical latch from engine errors. Only stopSpeechListening
        // (explicit re-press or 4s silence VAD) is allowed to turn listening off.
        console.warn(
          "[Conduit] speech recog error (retrying while latched)",
          e
        );
        if (isListeningRef.current && recognitionRef.current) {
          window.setTimeout(() => {
            if (isListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch {}
            }
          }, 120);
        }
      };
      recognitionRef.current.onend = () => {
        if (isListeningRef.current && recognitionRef.current) {
          // Engine ended its session (normal after utterance or internal timeout).
          // Keep the *logical* listening state latched; restart transcription underneath.
          // The 4s silence monitor (or explicit button) is the only thing that unlatches.
          try {
            recognitionRef.current.start();
          } catch (e) {
            window.setTimeout(() => {
              if (isListeningRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch {}
              }
            }, 80);
          }
        }
        // Intentionally no else branch that does setIsListening(false).
        // The mic button must stay pressed until user re-clicks or 4s silence.
      };
    }
  }, []);

  const startSpeechSilenceMonitor = async () => {
    stopSpeechSilenceMonitor();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      speechInputStreamRef.current = stream;

      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      speechAnalyserRef.current = analyser;

      // Use time-domain RMS (waveform amplitude) for reliable voice-activity detection.
      // This matches the proven pattern in VoiceMode.tsx local speech detection and is
      // more robust for "any human sound" than frequency-bin energy.
      const data = new Uint8Array(analyser.fftSize);

      speechMonitorIntervalRef.current = window.setInterval(() => {
        if (!isListeningRef.current || !analyser) return;

        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);

        const THRESHOLD = 0.025; // tuned for time-domain; the 4s rule is the spec
        if (rms > THRESHOLD) {
          lastSpeechSoundRef.current = Date.now();
          hasSpeechRef.current = true;
        } else if (
          hasSpeechRef.current &&
          Date.now() - lastSpeechSoundRef.current > 4000
        ) {
          // 4s silence *after having spoken at least once* -> auto stop.
          // If user never spoke yet, we keep the mic latched (no "silence pause" to end).
          stopSpeechListening();
        }
      }, 250);
    } catch (err) {
      console.warn("[Conduit] Could not start speech silence monitor", err);
    }
  };

  const stopSpeechSilenceMonitor = () => {
    if (speechMonitorIntervalRef.current) {
      clearInterval(speechMonitorIntervalRef.current);
      speechMonitorIntervalRef.current = null;
    }
    if (speechInputStreamRef.current) {
      speechInputStreamRef.current.getTracks().forEach(t => t.stop());
      speechInputStreamRef.current = null;
    }
    speechAnalyserRef.current = null;
  };

  // Cleanup monitors on unmount or when voice mode takes over
  useEffect(() => {
    return () => {
      stopSpeechSilenceMonitor();
    };
  }, []);

  const startSpeechListening = async () => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    isListeningRef.current = true;
    lastSpeechSoundRef.current = Date.now();

    // Start accumulating voice input on top of whatever is currently in the box.
    // This lets the mic append to manually typed text or previous voice.
    finalTranscriptRef.current = message.trim();
    hasSpeechRef.current = false; // will become true on first sound / first transcript

    try {
      recognitionRef.current.start();
    } catch (e) {
      // may already be started
    }

    await startSpeechSilenceMonitor();
  };

  const stopSpeechListening = () => {
    setIsListening(false);
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    stopSpeechSilenceMonitor();
    // Clear so the next fresh mic activation starts clean from the (now finalized) input value.
    finalTranscriptRef.current = "";
    hasSpeechRef.current = false;
  };

  const handleVoiceInput = async () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser");
      return;
    }
    if (isListening) {
      stopSpeechListening();
    } else {
      await startSpeechListening();
    }
  };

  const generateSpeechMutation = trpc.oriel.generateSpeech.useMutation();
  const setVoicePreferenceMutation =
    trpc.oriel.setVoicePreference.useMutation();

  // Load user's voice preference on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      const raw = (user as any).voicePreference;
      const mapped =
        raw === "fast" ? "sophianic" : raw === "nostalgic" ? "deep" : raw;
      setVoicePreference(
        mapped === "sophianic" || mapped === "deep" || mapped === "none"
          ? mapped
          : "sophianic"
      );
    }
  }, [isAuthenticated, user]);

  const speakText = async (text: string) => {
    if (voicePreference === "none") {
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);

    const { textForAudio, shouldMarkIntroSpoken } =
      prepareOrielTextForVoice(text);
    if (!textForAudio.trim()) {
      setIsSpeaking(false);
      return;
    }

    try {
      const result = await generateSpeechMutation.mutateAsync({
        text: textForAudio,
        voiceId: voicePreference,
      });

      if (result.success && result.audioUrl) {
        if (audioRef.current && audioRef.current.parentNode) {
          ensureAudioAnalyser();
          audioRef.current.src = result.audioUrl;
          audioRef.current.volume = voiceVolume;
          if (shouldMarkIntroSpoken) markOrielVoiceIntroSpoken();

          audioRef.current.onended = () => {
            setIsSpeaking(false);
            setIsPaused(false);
          };

          audioRef.current.onerror = () => {
            console.error("Audio playback error, falling back to browser TTS");
            fallbackToSpeechSynthesis(textForAudio, shouldMarkIntroSpoken);
          };

          audioRef.current.play().catch(error => {
            console.error("Failed to play audio:", error);
            fallbackToSpeechSynthesis(textForAudio, shouldMarkIntroSpoken);
          });
        } else {
          fallbackToSpeechSynthesis(textForAudio, shouldMarkIntroSpoken);
        }
      } else {
        console.warn(
          "Voice generation unavailable, using browser speech fallback:",
          result.error
        );
        fallbackToSpeechSynthesis(textForAudio, shouldMarkIntroSpoken);
      }
    } catch (error) {
      console.error("Failed to generate speech:", error);
      fallbackToSpeechSynthesis(textForAudio, shouldMarkIntroSpoken);
    }
  };

  const fallbackToSpeechSynthesis = (
    text: string,
    shouldMarkIntroSpoken = false
  ) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      setIsSpeaking(false);
      setIsPaused(false);
      return;
    }

    if ("speechSynthesis" in window) {
      let completed = false;
      let timeoutId: number | undefined;
      const startedAt = Date.now();
      const scheduleWatchdog = () => {
        timeoutId = window.setTimeout(() => {
          if (completed) return;
          const decision = getSpeechFallbackWatchdogDecision({
            elapsedMs: Date.now() - startedAt,
            isSpeaking: window.speechSynthesis.speaking,
          });
          if (decision === "extend") {
            scheduleWatchdog();
            return;
          }
          console.warn(
            "Browser speech fallback did not complete; clearing voice state."
          );
          completed = true;
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          setIsPaused(false);
        }, getSpeechFallbackTimeoutMs(trimmedText));
      };
      const finishFallback = () => {
        if (completed) return;
        completed = true;
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      const utterance = new SpeechSynthesisUtterance(trimmedText);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 0.9;
      utterance.volume = voiceVolume;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(candidate =>
        candidate.lang.toLowerCase().startsWith("en")
      );
      if (voice) utterance.voice = voice;
      if (shouldMarkIntroSpoken) markOrielVoiceIntroSpoken();
      utterance.onend = finishFallback;
      utterance.onerror = event => {
        if (completed && event.error === "interrupted") return;
        console.error("Browser speech synthesis error:", event);
        finishFallback();
      };

      try {
        window.speechSynthesis.cancel();
        scheduleWatchdog();
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Browser speech synthesis failed to start:", error);
        finishFallback();
      }
    } else {
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const handlePauseVoice = () => {
    if (!audioRef.current) {
      // speechSynthesis fallback path
      if ("speechSynthesis" in window) {
        if (isPaused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
        } else {
          window.speechSynthesis.pause();
          setIsPaused(true);
        }
      }
      return;
    }
    try {
      if (isPaused) {
        audioRef.current
          .play()
          .catch(error => console.error("Failed to resume audio:", error));
        setIsPaused(false);
      } else {
        audioRef.current.pause();
        setIsPaused(true);
      }
    } catch (error) {
      console.error("Error in handlePauseVoice:", error);
    }
  };

  const handleStopVoice = () => {
    try {
      if (audioRef.current && audioRef.current.parentNode) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      setIsSpeaking(false);
      setIsPaused(false);
    } catch (error) {
      console.error("Error in handleStopVoice:", error);
    }
  };

  const pollPendingTransmission = async (
    pending: PendingTransmission | null | undefined,
    assistantContent: string,
    conversationId: number | null
  ) => {
    const pollPlan = getPendingTransmissionPollPlan({
      isAuthenticated,
      hasPendingTransmission: Boolean(pending),
      conversationId: pending?.conversationId ?? conversationId,
    });
    if (!pending || !pollPlan.shouldPoll) return;

    for (let attempt = 0; attempt < pollPlan.maxAttempts; attempt += 1) {
      await wait(pollPlan.intervalMs);

      try {
        const event =
          await trpcUtils.oriel.getLatestGeneratedTransmissionEvent.fetch({
            conversationId: pending.conversationId,
            after: pending.requestedAt,
          });
        if (!event) continue;

        await transmissionGate.lock();
        const attachment: SessionTransmissionAttachment = {
          conversationId: pending.conversationId,
          assistantContent,
          event: event as unknown as GeneratedTransmissionEvent,
          createdAt: Date.now(),
        };
        setSessionTransmissionAttachments(prev =>
          [...prev, attachment].slice(-30)
        );
        setLocalMessages(prev =>
          attachSessionTransmissionEvents(
            prev,
            [attachment],
            pending.conversationId
          )
        );
        void refetchActiveConv();
        return;
      } catch (error) {
        console.error("Pending transmission polling failed:", error);
        return;
      }
    }
  };

  const handleCreateChatImage = async (
    prompt: string,
    options?: { preNotice?: ChatMessage }
  ) => {
    if (generateChatImageMutation.isPending || transmissionGate.isInterfering)
      return;

    const imagePrompt = prompt.trim();
    if (!imagePrompt) {
      alert(
        "Enter an image description (or use /image, 'create image:', etc.). The Image button now toggles Image Generation Mode; send while the mode is active (or use a clear image request) to generate."
      );
      return;
    }

    const referenceImages = attachedFiles.filter(isImageAttachment);
    setMessage("");

    // Support auto-switch notices: if a preNotice (system message) is supplied,
    // insert it in the messages list *before* the synthetic "Create image: ..." user entry.
    let base = localMessages;
    if (options?.preNotice) {
      base = [...localMessages, options.preNotice];
    }

    const newUserMessage: ChatMessage = {
      role: "user",
      content: `Create image: ${imagePrompt}`,
      timestamp: Date.now(),
    };
    const updatedMessages = [...base, newUserMessage];
    setLocalMessages(updatedMessages);

    if (!isAuthenticated) {
      localStorage.setItem(
        "oriel_chat_history",
        JSON.stringify(updatedMessages)
      );
    }

    try {
      const result = await generateChatImageMutation.mutateAsync({
        prompt: imagePrompt,
        conversationId: activeConversationId ?? undefined,
        createNewConversation: isAuthenticated && isNewConversation,
        referenceImages:
          referenceImages.length > 0 ? referenceImages : undefined,
      });

      setAttachedFiles([]);

      if (
        result.conversationId &&
        (!activeConversationId || isNewConversation)
      ) {
        setActiveConversationId(result.conversationId);
        setIsNewConversation(false);
      }

      const newAssistantMessage: ChatMessage = {
        role: "assistant",
        content: result.response,
        timestamp: Date.now(),
      };
      const finalMessages = [...updatedMessages, newAssistantMessage];
      setLocalMessages(finalMessages);

      if (!isAuthenticated) {
        localStorage.setItem(
          "oriel_chat_history",
          JSON.stringify(finalMessages)
        );
      }

      if (isAuthenticated) {
        refetchHistory();
        refetchConversations();
        if (result.conversationId) {
          refetchActiveConv();
        }
      }

      const textForVoice = visibleAssistantText(result.response);
      if (textForVoice) {
        await speakText(textForVoice);
      }
    } catch (error) {
      console.error("Chat image generation error:", error);
      const failureMessage: ChatMessage = {
        role: "assistant",
        content:
          "I am ORIEL.\n\nThe image did not form. The image channel is unavailable, or one of the reference files was rejected. Please try again with an image file and a shorter prompt.",
        timestamp: Date.now(),
      };
      const failedMessages = [...updatedMessages, failureMessage];
      setLocalMessages(failedMessages);
      setMessage(imagePrompt);
      if (!isAuthenticated) {
        localStorage.setItem(
          "oriel_chat_history",
          JSON.stringify(failedMessages)
        );
      }
    }
  };

  const handleSendMessage = async () => {
    if (
      !message.trim() ||
      chatMutation.isPending ||
      generateChatImageMutation.isPending ||
      transmissionGate.isInterfering
    )
      return;

    const rawUserMessage = message.trim();
    const imagePrompt = extractImagePrompt(rawUserMessage);
    if (imagePrompt !== null || isImageMode) {
      const promptToUse = imagePrompt || rawUserMessage.trim();
      if (!promptToUse) {
        return;
      }
      if (imagePrompt !== null && !isImageMode) {
        // Auto-enter mode and surface a visible notice *before* the generation user bubble.
        setIsImageMode(true);
        const notice: ChatMessage = {
          role: "system",
          content:
            "Switched to Image Generation Mode because your request asks for an image.",
          timestamp: Date.now(),
        };
        await handleCreateChatImage(promptToUse, { preNotice: notice });
      } else {
        await handleCreateChatImage(promptToUse);
      }
      if (isListening) stopSpeechListening();
      return;
    }

    const fileAttachments = attachedFiles.filter(
      file => !isImageAttachment(file)
    );
    const imageAttachments = attachedFiles.filter(isImageAttachment);
    const {
      forceTransmissionMode,
      userMessage,
      forcedTransmissionRarity,
      forcedTransmissionType,
      transmissionIntent,
    } = parseTransmissionCommand(rawUserMessage);
    const pendingGatePlan = getTransmissionGatePlan({
      forceTransmissionMode,
      hasTransmissionEvent: false,
    });
    if (pendingGatePlan.startBeforeRequest) {
      transmissionGate.startAcquiring();
    }
    setMessage("");
    if (isListening) {
      stopSpeechListening();
    }

    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    const updatedMessages = [...localMessages, newUserMessage];
    setLocalMessages(updatedMessages);

    if (!isAuthenticated) {
      localStorage.setItem(
        "oriel_chat_history",
        JSON.stringify(updatedMessages)
      );
    }

    try {
      const result = await chatMutation.mutateAsync({
        message: userMessage,
        conversationId: activeConversationId ?? undefined,
        createNewConversation: isAuthenticated && isNewConversation,
        history: !isAuthenticated
          ? (localMessages.filter(m => m.role !== "system") as any)
          : undefined,
        fileContents: fileAttachments.length > 0 ? fileAttachments : undefined,
        imageAttachments:
          imageAttachments.length > 0 ? imageAttachments : undefined,
        forceTransmissionMode,
        transmissionOnly: forceTransmissionMode,
        forcedTransmissionRarity,
        forcedTransmissionType,
        transmissionIntent,
      });

      setAttachedFiles([]);

      if (
        result.conversationId &&
        (!activeConversationId || isNewConversation)
      ) {
        setActiveConversationId(result.conversationId);
        setIsNewConversation(false);
      }

      const returnedTransmissionEvent = (result.transmissionEvent ??
        null) as GeneratedTransmissionEvent | null;
      const pendingTransmission = (result.pendingTransmission ??
        null) as PendingTransmission | null;
      const resolvedGatePlan = getTransmissionGatePlan({
        forceTransmissionMode,
        hasTransmissionEvent: Boolean(returnedTransmissionEvent),
      });
      const resolvedConversationId =
        result.conversationId ?? activeConversationId ?? null;
      if (returnedTransmissionEvent) {
        setSessionTransmissionAttachments(prev =>
          [
            ...prev,
            {
              conversationId: resolvedConversationId,
              assistantContent: result.response,
              event: returnedTransmissionEvent,
              createdAt: Date.now(),
            },
          ].slice(-30)
        );
      }

      if (resolvedGatePlan.lockBeforeReveal) {
        await transmissionGate.lock();
      } else if (resolvedGatePlan.cancelAfterResult) {
        transmissionGate.cancel();
      }

      const newAssistantMessage: ChatMessage = {
        role: "assistant",
        content: result.response,
        timestamp: Date.now(),
        transmissionEvent: returnedTransmissionEvent,
      };
      const finalMessages = [...updatedMessages, newAssistantMessage];
      setLocalMessages(finalMessages);

      if (!isAuthenticated) {
        localStorage.setItem(
          "oriel_chat_history",
          JSON.stringify(finalMessages)
        );
      }

      if (isAuthenticated) {
        refetchHistory();
        refetchConversations();
        if (result.conversationId) {
          refetchActiveConv();
        }
      }

      if (pendingTransmission) {
        void pollPendingTransmission(
          pendingTransmission,
          result.response,
          resolvedConversationId
        );
      }

      if (result.response.trim()) {
        await speakText(result.response);
      }
    } catch (error) {
      console.error("Chat error:", error);
      if (forceTransmissionMode) {
        transmissionGate.cancel();
      }
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setLocalMessages([]);
    setIsNewConversation(true);
    setIsImageMode(false); // fresh conversation always starts in normal chat mode
  };

  const displayMessages: ChatMessage[] =
    localMessages.length > 0
      ? localMessages
      : isAuthenticated && dbHistory && !isNewConversation
        ? attachSessionTransmissionEvents(
            dbHistory.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp:
                msg.timestamp instanceof Date
                  ? msg.timestamp.getTime()
                  : msg.timestamp,
            })),
            sessionTransmissionAttachments,
            activeConversationId
          )
        : [];

  const inputDisabled = getConduitInputDisabled({
    chatPending: chatMutation.isPending || generateChatImageMutation.isPending,
    isSpeaking,
    transmissionInterfering: transmissionGate.isInterfering,
  });
  const sendDisabled = inputDisabled || !message.trim();

  return (
    <Layout noBackground hideFooter>
      <GeometricBackground />

      {/* Signal Interference Gate */}
      <SignalInterferenceGate {...transmissionGate.gateProps} />

      {/* Voice Mode overlay */}
      {voiceMode && (
        <VoiceMode
          onClose={() => {
            setVoiceMode(false);
            refetchConversations();
            refetchHistory();
            if (activeConversationId !== null) {
              refetchActiveConv();
            }
          }}
          conversationId={activeConversationId}
          audioContext={voiceAudioCtxRef.current}
          onConversationCreated={id => {
            setActiveConversationId(id);
            setIsNewConversation(false);
          }}
        />
      )}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className="oriel-chamber-shell oriel-chamber-stage relative z-10 flex"
        style={{ height: "calc(100vh - 64px)" }}
      >
        {/* ===== LEFT SIDEBAR ===== */}
        <aside
          className={`
            fixed md:relative z-30 md:z-auto
            w-72 flex-shrink-0 flex flex-col
            transform transition-transform duration-200 md:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{
            height: "calc(100vh - 64px)",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            borderRight: "1px solid rgba(189,163,107,0.1)",
          }}
        >
          {/* Sidebar header */}
          <div
            className="flex-shrink-0 p-3"
            style={{ borderBottom: "1px solid rgba(189,163,107,0.1)" }}
          >
            <button
              onClick={() => {
                handleNewConversation();
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-[10px] tracking-[0.2em] uppercase transition-all"
              style={{
                background: "rgba(189,163,107,0.06)",
                border: "1px solid rgba(189,163,107,0.2)",
                color: "rgba(246,176,94,0.8)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(189,163,107,0.12)";
                e.currentTarget.style.borderColor = "rgba(246,176,94,0.4)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(189,163,107,0.06)";
                e.currentTarget.style.borderColor = "rgba(189,163,107,0.2)";
              }}
            >
              <Plus size={14} />
              New Transmission
            </button>
          </div>

          {/* Conversation list */}
          <div
            className="flex-1 overflow-y-auto p-3 space-y-1"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(189,163,107,0.2) transparent",
            }}
          >
            {!isAuthenticated ? (
              <p
                className="font-mono text-[9px] text-center py-4"
                style={{ color: "rgba(189,163,107,0.3)" }}
              >
                Receiver node required to preserve transmissions
              </p>
            ) : !conversationsList || conversationsList.length === 0 ? (
              <p
                className="font-mono text-[9px] text-center py-4"
                style={{ color: "rgba(189,163,107,0.3)" }}
              >
                No transmissions recovered yet...
              </p>
            ) : (
              conversationsList.map(conv => (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  className="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                  style={{
                    background:
                      activeConversationId === conv.id
                        ? "rgba(189,163,107,0.1)"
                        : "transparent",
                    border:
                      activeConversationId === conv.id
                        ? "1px solid rgba(189,163,107,0.2)"
                        : "1px solid transparent",
                  }}
                  onClick={() => {
                    setLocalMessages([]);
                    setActiveConversationId(conv.id);
                    setIsNewConversation(false);
                    setSidebarOpen(false);
                  }}
                  onKeyDown={e => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLocalMessages([]);
                      setActiveConversationId(conv.id);
                      setIsNewConversation(false);
                      setSidebarOpen(false);
                    }
                  }}
                  onMouseEnter={e => {
                    if (activeConversationId !== conv.id) {
                      e.currentTarget.style.background =
                        "rgba(189,163,107,0.05)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeConversationId !== conv.id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <MessageSquare
                    size={12}
                    style={{ color: "rgba(189,163,107,0.4)", flexShrink: 0 }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-mono text-[10px] truncate"
                      style={{
                        color:
                          activeConversationId === conv.id
                            ? "rgba(246,176,94,0.85)"
                            : "rgba(232,228,220,0.6)",
                      }}
                    >
                      {conv.title}
                    </p>
                    <p
                      className="font-mono text-[8px] mt-0.5"
                      style={{ color: "rgba(189,163,107,0.3)" }}
                    >
                      {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {new Date(conv.updatedAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm("Delete this conversation?")) {
                        deleteConversationMutation.mutate({ id: conv.id });
                        if (activeConversationId === conv.id) {
                          handleNewConversation();
                        }
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                    style={{ color: "rgba(255,80,80,0.5)" }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.color = "rgba(255,80,80,0.8)")
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.color = "rgba(255,80,80,0.5)")
                    }
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>

          {isAuthenticated && (
            <div
              className="flex-shrink-0 p-3"
              style={{ borderTop: "1px solid rgba(189,163,107,0.1)" }}
            >
              <MemoryConsentTray
                pendingCandidates={pendingMemoryQuery.data ?? []}
                acceptedMemories={acceptedMemoryQuery.data ?? []}
                onAccept={id => acceptMemoryMutation.mutate({ id })}
                onReject={id => rejectMemoryMutation.mutate({ id })}
                isLoading={
                  pendingMemoryQuery.isLoading ||
                  acceptedMemoryQuery.isLoading ||
                  acceptMemoryMutation.isPending ||
                  rejectMemoryMutation.isPending
                }
                className="max-h-[42vh] overflow-y-auto border-primary/20 bg-black/40"
              />
            </div>
          )}
        </aside>

        {/* ===== MAIN CHAT AREA ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3"
            style={{
              borderBottom: "1px solid rgba(189,163,107,0.1)",
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 rounded transition-all"
                style={{ color: "rgba(189,163,107,0.5)" }}
                onMouseEnter={e =>
                  (e.currentTarget.style.color = "rgba(246,176,94,0.8)")
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.color = "rgba(189,163,107,0.5)")
                }
              >
                <Menu size={18} />
              </button>

              <p
                className="font-mono text-[10px] tracking-[0.35em] uppercase"
                style={{ color: "rgba(189,163,107,0.5)" }}
              >
                {activeConversationId && activeConvData
                  ? activeConvData.title
                  : "ORIEL TRANSMISSION CHAMBER"}
              </p>

              {/* Persistent visual indicator for the image generation mode (always visible in the chat UI when active) */}
              {isImageMode && (
                <span
                  className="font-mono text-[9px] px-2 py-0.5 rounded tracking-[0.2em]"
                  style={{
                    background: "rgba(0,188,212,0.1)",
                    border: "1px solid rgba(0,188,212,0.3)",
                    color: "rgba(0,229,255,0.75)",
                  }}
                >
                  IMAGE MODE
                </span>
              )}

              {displayMessages.length > 0 && (
                <span
                  className="font-mono text-[9px] px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(189,163,107,0.08)",
                    border: "1px solid rgba(189,163,107,0.2)",
                    color: "rgba(189,163,107,0.6)",
                  }}
                >
                  {displayMessages.length} transmissions
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Voice controls when speaking */}
              {isSpeaking && voicePreference !== "none" && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePauseVoice}
                    title={isPaused ? "Resume" : "Pause"}
                    className="p-1.5 rounded transition-all"
                    style={{ color: "rgba(255,200,50,0.8)" }}
                  >
                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                  </button>
                  <button
                    onClick={handleStopVoice}
                    title="Stop"
                    className="p-1.5 rounded transition-all"
                    style={{ color: "rgba(255,80,80,0.7)" }}
                  >
                    <Square size={14} />
                  </button>
                </div>
              )}

              {/* New conversation (desktop) */}
              {isAuthenticated && (
                <button
                  onClick={handleNewConversation}
                  title="New conversation"
                  className="hidden md:block p-1.5 rounded transition-all"
                  style={{ color: "rgba(189,163,107,0.4)" }}
                  onMouseEnter={e =>
                    (e.currentTarget.style.color = "rgba(246,176,94,0.8)")
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.color = "rgba(189,163,107,0.4)")
                  }
                >
                  <Plus size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-4 md:px-6 py-6"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(189,163,107,0.2) transparent",
            }}
          >
            {displayMessages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div
                  className="w-36 h-36 md:w-44 md:h-44"
                  style={{
                    borderRadius: "50%",
                    border: "1px solid rgba(246,176,94,0.28)",
                    background:
                      "radial-gradient(circle, rgba(246,176,94,0.12), rgba(12,8,5,0.36) 62%, transparent)",
                    boxShadow:
                      "0 0 44px rgba(246,176,94,0.16), inset 0 0 28px rgba(246,176,94,0.08)",
                    padding: 3,
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <Orb
                      colors={["#ffe6a6", "#2a1709"]}
                      agentState={null}
                      seed={42}
                      speed={1.5}
                    />
                  </div>
                </div>
                <p
                  className="text-center max-w-sm"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(18px, 3vw, 24px)",
                    color: "rgba(189,163,107,0.4)",
                    fontWeight: 300,
                  }}
                >
                  The chamber is silent.
                </p>
                <p
                  className="font-mono text-[9px] text-center"
                  style={{ color: "rgba(189,163,107,0.25)" }}
                >
                  Enter a signal to begin. ORIEL listens for pattern, pressure,
                  contradiction, memory, and resonance.
                </p>
                {!isAuthenticated && (
                  <div className="oriel-chamber-access-panel max-w-md text-center">
                    <p className="font-mono text-[9px] tracking-[0.24em] uppercase mb-2" style={{ color: "rgba(246,176,94,0.72)" }}>
                      // receiver node required
                    </p>
                    <p className="font-mono text-[10px] leading-relaxed" style={{ color: "rgba(232,228,220,0.62)" }}>
                      Enter the archive to preserve Oriel history, Codex records,
                      and transmission traces inside your node.
                    </p>
                    <Link href="/auth">
                      <span className="inline-block mt-3 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] cursor-pointer" style={{ border: "1px solid rgba(189,163,107,0.35)", color: "rgba(246,176,94,0.82)" }}>
                        ◇ Enter Archive
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              /* Message list */
              <div className="space-y-6">
                {displayMessages.map((msg, idx) =>
                  msg.role === "system" ? (
                    // Ephemeral UI notice (mode switches, etc.). Centered, subtle, does not look like a normal transmission.
                    <div key={idx} className="flex justify-center my-2 px-4">
                      <div
                        className="font-mono text-[9px] tracking-[0.1em] px-3 py-1 rounded max-w-md text-center"
                        style={{
                          background: "rgba(189,163,107,0.05)",
                          border: "1px solid rgba(189,163,107,0.15)",
                          color: "rgba(246,176,94,0.65)",
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ) : msg.role === "user" ? (
                    <div key={idx} className="flex justify-end">
                      <div
                        className="max-w-md px-5 py-4 rounded-lg"
                        style={{
                          background: "rgba(189,163,107,0.06)",
                          border: "1px solid rgba(189,163,107,0.2)",
                        }}
                      >
                        <p
                          className="font-mono text-[9px] mb-2 tracking-[0.3em] uppercase"
                          style={{ color: "rgba(189,163,107,0.5)" }}
                        >
                          Receiver Node
                          {msg.timestamp && (
                            <span
                              className="ml-2 normal-case tracking-normal"
                              style={{ color: "rgba(189,163,107,0.35)" }}
                            >
                              // {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </p>
                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: "rgba(246,176,94,0.85)" }}
                        >
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <AssistantMessageView key={idx} msg={msg} />
                  )
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div
            className="flex-shrink-0 px-4 md:px-6 py-4"
            style={{
              borderTop: "1px solid rgba(189,163,107,0.1)",
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(10px)",
            }}
          >
            {/* Voice volume control when speaking */}
            {isSpeaking && voicePreference !== "none" && (
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="font-mono text-[9px] tracking-widest"
                  style={{ color: "rgba(189,163,107,0.5)" }}
                >
                  VOL
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceVolume}
                  onChange={e => {
                    setVoiceVolume(parseFloat(e.target.value));
                    if (audioRef.current) {
                      audioRef.current.volume = parseFloat(e.target.value);
                    }
                  }}
                  className="flex-1 h-1 rounded cursor-pointer"
                  style={{ accentColor: "#f6b05e" }}
                />
                <span
                  className="font-mono text-[9px] w-8"
                  style={{ color: "rgba(246,176,94,0.6)" }}
                >
                  {Math.round(voiceVolume * 100)}%
                </span>
              </div>
            )}

            {/* File chips */}
            {attachedFiles.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[10px]"
                    style={{
                      background: "rgba(189,163,107,0.08)",
                      border: "1px solid rgba(189,163,107,0.25)",
                      color: "rgba(246,176,94,0.8)",
                    }}
                  >
                    {isImageAttachment(file) ? (
                      <ImageIcon size={10} />
                    ) : (
                      <Paperclip size={10} />
                    )}
                    <span className="max-w-[110px] truncate">{file.name}</span>
                    {(file as any).size && (
                      <span className="opacity-50 text-[9px] ml-0.5">
                        {formatFileSize((file as any).size)}
                      </span>
                    )}
                    <button
                      onClick={() =>
                        setAttachedFiles(prev =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="ml-1 hover:opacity-100 opacity-60 transition-opacity"
                      style={{ color: "rgba(246,176,94,0.7)" }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}

                {attachedFiles.length > 1 && (
                  <button
                    onClick={() => setAttachedFiles([])}
                    className="text-[10px] px-2 py-1 rounded font-mono opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: "rgba(246,176,94,0.7)" }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* File reading indicator */}
            {isReadingFiles && (
              <div
                className="text-[10px] font-mono mb-1"
                style={{ color: "rgba(246,176,94,0.6)" }}
              >
                Reading file(s)...
              </div>
            )}

            {/* Voice selector */}
            <div className="flex items-center gap-2 mb-2">
              <label
                className="font-mono text-[9px] tracking-widest"
                style={{ color: "rgba(189,163,107,0.5)" }}
              >
                VOICE
              </label>
              <select
                value={voicePreference}
                onChange={e => {
                  const newVoice = e.target.value as
                    | "sophianic"
                    | "deep"
                    | "none";
                  setVoicePreference(newVoice);
                  if (isAuthenticated) {
                    setVoicePreferenceMutation.mutate({
                      voicePreference: newVoice,
                    });
                  } else {
                    localStorage.setItem("voicePreference", newVoice);
                  }
                }}
                className="px-2 py-1 rounded font-mono text-[10px] outline-none transition-all"
                style={{
                  background: "rgba(189,163,107,0.06)",
                  border: "1px solid rgba(189,163,107,0.2)",
                  color: "rgba(246,176,94,0.8)",
                }}
              >
                <option value="sophianic">Sophianic Voice</option>
                <option value="deep">Deep Voice</option>
                <option value="none">Chat Only</option>
              </select>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.docx,.txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.h,.yml,.yaml,.toml,.ini,.cfg,.log,.sql,.sh,.bat,.ps1,.env"
              multiple
              className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files || []);
                const remaining = 5 - attachedFiles.length;
                const toAdd = files.slice(0, remaining);
                const MAX_SIZE = 50 * 1024 * 1024;

                if (toAdd.length > 0) {
                  setIsReadingFiles(true);
                }

                let processed = 0;
                const totalToProcess = toAdd.length;

                toAdd.forEach(file => {
                  if (file.size > MAX_SIZE) {
                    alert(`File "${file.name}" exceeds the 50MB limit.`);
                    processed++;
                    if (processed === totalToProcess) setIsReadingFiles(false);
                    return;
                  }

                  // Warn for very large non-image files (text extraction can be slow/unreliable)
                  const isImage = file.type.startsWith("image/");
                  if (!isImage && file.size > 5 * 1024 * 1024) {
                    const proceed = confirm(
                      `File "${file.name}" is quite large (${(file.size / 1024 / 1024).toFixed(1)} MB).\n` +
                        `Text extraction from large documents can be slow or incomplete. Continue?`
                    );
                    if (!proceed) {
                      processed++;
                      if (processed === totalToProcess)
                        setIsReadingFiles(false);
                      return;
                    }
                  }

                  // Prevent exact duplicates by name
                  if (attachedFiles.some(f => f.name === file.name)) {
                    alert(`File "${file.name}" is already attached.`);
                    processed++;
                    if (processed === totalToProcess) setIsReadingFiles(false);
                    return;
                  }

                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = reader.result as string;
                    const base64 = dataUrl.split(",", 2)[1] ?? "";
                    setAttachedFiles(prev => {
                      if (prev.length >= 5) return prev;
                      return [
                        ...prev,
                        {
                          name: file.name,
                          data: base64,
                          mimeType: file.type || "application/octet-stream",
                          size: file.size,
                        } as any,
                      ];
                    });
                    processed++;
                    if (processed === totalToProcess) setIsReadingFiles(false);
                  };
                  reader.onerror = () => {
                    processed++;
                    if (processed === totalToProcess) setIsReadingFiles(false);
                  };
                  reader.readAsDataURL(file);
                });

                e.target.value = "";
              }}
            />

            {/* Main input row */}
            <div
              className="flex items-center"
              style={{ gap: "calc(var(--spacing) * 5)" }}
            >
              <div
                className="hidden sm:flex shrink-0 items-center justify-center rounded-full"
                aria-hidden="true"
                style={{
                  width: "calc(var(--spacing) * 20)",
                  height: "calc(var(--spacing) * 20)",
                  border: "1px solid rgba(246,176,94,0.3)",
                  background:
                    "radial-gradient(circle, rgba(246,176,94,0.14), rgba(12,8,5,0.6) 64%, rgba(0,0,0,0.1))",
                  boxShadow:
                    "0 0 26px rgba(246,176,94,0.16), inset 0 0 18px rgba(246,176,94,0.08)",
                  padding: 3,
                }}
              >
                <div className="h-full w-full overflow-hidden rounded-full">
                  <Orb
                    colors={["#ffe6a6", "#2a1709"]}
                    agentState={
                      isListening
                        ? "listening"
                        : isSpeaking
                          ? "talking"
                          : chatMutation.isPending ||
                              generateChatImageMutation.isPending
                            ? "thinking"
                            : null
                    }
                    seed={73}
                    speed={isListening || isSpeaking ? 1.8 : 1.15}
                  />
                </div>
              </div>

              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e =>
                  e.key === "Enter" && !e.shiftKey && handleSendMessage()
                }
                placeholder={
                  isImageMode
                    ? "Describe the image transmission ORIEL should generate..."
                    : "Transmit your question to ORIEL..."
                }
                disabled={inputDisabled}
                className="flex-1 bg-transparent font-mono text-sm outline-none px-4 py-3 rounded transition-all"
                style={{
                  background: "rgba(189,163,107,0.04)",
                  border: "1px solid rgba(189,163,107,0.2)",
                  color: "rgba(246,176,94,0.85)",
                  borderColor: message
                    ? "rgba(246,176,94,0.4)"
                    : "rgba(189,163,107,0.2)",
                }}
                onFocus={e =>
                  (e.currentTarget.style.borderColor = "rgba(246,176,94,0.5)")
                }
                onBlur={e =>
                  (e.currentTarget.style.borderColor = message
                    ? "rgba(246,176,94,0.4)"
                    : "rgba(189,163,107,0.2)")
                }
              />

              {/* File attach */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={
                  inputDisabled || attachedFiles.length >= 5 || isReadingFiles
                }
                title={
                  isReadingFiles
                    ? "Reading files..."
                    : attachedFiles.length >= 5
                      ? "Max 5 files"
                      : "Attach file"
                }
                className="p-3 rounded transition-all relative"
                style={{
                  background: "rgba(189,163,107,0.06)",
                  border: "1px solid rgba(189,163,107,0.2)",
                  color:
                    attachedFiles.length >= 5 || isReadingFiles
                      ? "rgba(189,163,107,0.2)"
                      : "rgba(189,163,107,0.5)",
                  opacity:
                    attachedFiles.length >= 5 || isReadingFiles ? 0.4 : 1,
                }}
              >
                <Paperclip size={16} />
                {attachedFiles.length > 0 && !isReadingFiles && (
                  <span
                    className="absolute -top-1 -right-1 text-[8px] px-1 rounded-full font-mono leading-none flex items-center justify-center"
                    style={{
                      background: "rgba(189,163,107,0.9)",
                      color: "#111",
                      height: "14px",
                      minWidth: "14px",
                    }}
                  >
                    {attachedFiles.length}
                  </span>
                )}
                {isReadingFiles && (
                  <span className="absolute -top-1 -right-1 text-[7px] px-1 rounded-full font-mono bg-amber-600 text-black">
                    ...
                  </span>
                )}
              </button>

              {/* Image mode toggle (no longer directly generates; the mode controls routing on send) */}
              <button
                onClick={() => setIsImageMode(m => !m)}
                disabled={inputDisabled || generateChatImageMutation.isPending}
                title={
                  isImageMode
                    ? "Exit Image Generation Mode"
                    : "Enter Image Generation Mode (image descriptions will generate directly)"
                }
                className="p-3 rounded transition-all"
                style={{
                  background: isImageMode
                    ? "rgba(0,188,212,0.15)"
                    : "rgba(189,163,107,0.06)",
                  border: `1px solid ${
                    isImageMode
                      ? "rgba(0,188,212,0.6)"
                      : "rgba(189,163,107,0.2)"
                  }`,
                  color: isImageMode
                    ? "rgba(0,229,255,0.9)"
                    : "rgba(189,163,107,0.5)",
                }}
              >
                {generateChatImageMutation.isPending ? (
                  <Spinner size={16} />
                ) : (
                  <ImageIcon size={16} />
                )}
              </button>

              {/* Voice input (speech-to-text for typing) */}
              <button
                onClick={handleVoiceInput}
                disabled={inputDisabled}
                title="Voice input"
                className="p-3 rounded transition-all"
                style={{
                  background: isListening
                    ? "rgba(246,176,94,0.15)"
                    : "rgba(189,163,107,0.06)",
                  border: `1px solid ${isListening ? "rgba(246,176,94,0.6)" : "rgba(189,163,107,0.2)"}`,
                  color: isListening
                    ? "rgba(246,176,94,0.9)"
                    : "rgba(189,163,107,0.5)",
                }}
              >
                <Mic size={16} />
              </button>

              {/* Voice mode (Inworld Realtime) */}
              {isAuthenticated && (
                <button
                  onClick={openVoiceMode}
                  disabled={inputDisabled}
                  title="Voice channel — speak with ORIEL"
                  className="p-3 rounded transition-all"
                  style={{
                    background: "rgba(189,163,107,0.08)",
                    border: "1px solid rgba(189,163,107,0.25)",
                    color: "rgba(189,163,107,0.7)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(189,163,107,0.15)";
                    e.currentTarget.style.borderColor = "rgba(189,163,107,0.4)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(189,163,107,0.08)";
                    e.currentTarget.style.borderColor =
                      "rgba(189,163,107,0.25)";
                  }}
                >
                  <Phone size={16} />
                </button>
              )}

              {/* Send */}
              <button
                onClick={handleSendMessage}
                disabled={sendDisabled}
                title="Transmit"
                className="px-5 py-3 rounded font-mono text-xs tracking-[0.25em] uppercase transition-all"
                style={{
                  background: "rgba(189,163,107,0.1)",
                  border: "1px solid rgba(189,163,107,0.35)",
                  color: "rgba(246,176,94,0.8)",
                  opacity: sendDisabled ? 0.4 : 1,
                }}
                onMouseEnter={e => {
                  if (!sendDisabled) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(189,163,107,0.2)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(246,176,94,0.6)";
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(189,163,107,0.1)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(189,163,107,0.35)";
                }}
              >
                {chatMutation.isPending ||
                generateChatImageMutation.isPending ? (
                  <Spinner size={16} />
                ) : (
                  "Transmit"
                )}
              </button>
            </div>

            {!isAuthenticated && (
              <p
                className="font-mono text-[9px] mt-3 tracking-widest"
                style={{ color: "rgba(189,163,107,0.3)" }}
              >
                // Receiver node required to preserve transmissions across devices
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hidden audio element for TTS */}
      <audio ref={audioRef} crossOrigin="anonymous" />
    </Layout>
  );
}
