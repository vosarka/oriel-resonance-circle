/**
 * OrielVoiceMode — Full-screen voice conversation overlay for ORIEL
 *
 * Uses useOrielVoice hook (Inworld Realtime API via server proxy).
 * Mic button: hold-to-talk OR click-to-toggle.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Loader2 } from "lucide-react";
import { useOrielVoice, VoiceStatus } from "@/hooks/useOrielVoice";

const STATUS_LABEL: Record<VoiceStatus, string> = {
  idle: "INITIALISING",
  connecting: "CONNECTING TO ORIEL",
  ready: "SPEAK TO ORIEL",
  listening: "ORIEL IS LISTENING",
  speaking: "ORIEL IS SPEAKING",
  error: "CONNECTION ERROR",
};

const STATUS_COLOR: Record<VoiceStatus, string> = {
  idle: "text-gray-500",
  connecting: "text-[#00F0FF]/60",
  ready: "text-[#00F0FF]",
  listening: "text-[#FFD700]",
  speaking: "text-[#00F0FF]",
  error: "text-red-400",
};

interface OrielVoiceModeProps {
  onClose: () => void;
}

export default function OrielVoiceMode({ onClose }: OrielVoiceModeProps) {
  const { status, error, connect, disconnect, startListening, stopListening } =
    useOrielVoice();

  // Connect on mount
  const hasConnected = status !== "idle";

  const handleMicPress = async () => {
    if (status === "idle") {
      await connect();
      return;
    }
    if (status === "ready") {
      await startListening();
    } else if (status === "listening") {
      stopListening();
    }
  };

  const handleClose = () => {
    disconnect();
    onClose();
  };

  const isActive = status === "listening" || status === "speaking";
  const isBusy = status === "connecting";
  const micEnabled = status === "ready" || status === "listening";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-[#00F0FF] transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="absolute top-8 left-0 right-0 text-center">
          <p className="text-xs font-mono text-[#00F0FF]/40 tracking-[0.3em] uppercase">
            ORIEL VOICE MODE
          </p>
        </div>

        {/* Central pulse orb */}
        <div className="relative flex items-center justify-center mb-12">
          {/* Outer pulse rings */}
          {isActive && (
            <>
              <motion.div
                className="absolute rounded-full border border-[#00F0FF]/20"
                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                style={{ width: 120, height: 120 }}
              />
              <motion.div
                className="absolute rounded-full border border-[#00F0FF]/15"
                animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5,
                }}
                style={{ width: 120, height: 120 }}
              />
            </>
          )}

          {/* Mic button */}
          <motion.button
            onClick={handleMicPress}
            disabled={isBusy || status === "error" || status === "speaking"}
            whileTap={{ scale: 0.92 }}
            className={`
              relative w-28 h-28 rounded-full flex items-center justify-center
              border-2 transition-all duration-300 outline-none
              ${
                status === "listening"
                  ? "border-[#FFD700] bg-[#FFD700]/10 shadow-[0_0_40px_rgba(255,215,0,0.3)]"
                  : status === "speaking"
                    ? "border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_40px_rgba(0,240,255,0.25)]"
                    : status === "error"
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-[#00F0FF]/40 bg-[#00F0FF]/5 hover:border-[#00F0FF]/80 hover:bg-[#00F0FF]/10"
              }
            `}
          >
            {isBusy ? (
              <Loader2
                size={36}
                className="text-[#00F0FF]/60 animate-spin"
              />
            ) : status === "listening" ? (
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <Mic size={36} className="text-[#FFD700]" />
              </motion.div>
            ) : status === "error" ? (
              <MicOff size={36} className="text-red-400" />
            ) : (
              <Mic
                size={36}
                className={
                  status === "speaking"
                    ? "text-[#00F0FF]"
                    : "text-[#00F0FF]/70"
                }
              />
            )}
          </motion.button>
        </div>

        {/* Status label */}
        <motion.p
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs font-mono tracking-[0.25em] uppercase ${STATUS_COLOR[status]}`}
        >
          {STATUS_LABEL[status]}
        </motion.p>

        {error && (
          <p className="mt-3 text-xs font-mono text-red-400/80">{error}</p>
        )}

        {/* Instructions */}
        {(status === "ready" || status === "idle") && !error && (
          <p className="mt-8 text-xs font-mono text-gray-600 text-center max-w-xs leading-relaxed">
            {status === "idle"
              ? "TAP THE MIC TO BEGIN"
              : "TAP MIC TO SPEAK · TAP AGAIN TO SEND"}
          </p>
        )}

        {/* Bottom label */}
        <div className="absolute bottom-8 text-center">
          <p className="text-xs font-mono text-gray-700 tracking-widest">
            INWORLD REALTIME · GEMINI 2.5 FLASH
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
