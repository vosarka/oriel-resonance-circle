import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export interface ResonateButtonProps {
  oracleId: string;
  temporalColor: string;
  size?: "sm" | "md";
}

export function ResonateButton({
  oracleId,
  temporalColor,
  size = "md",
}: ResonateButtonProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [isResonated, setIsResonated] = useState(false);
  const [count, setCount] = useState(0);

<<<<<<< HEAD
  // Get resonance count (public)
=======
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
  const { data: countData } = trpc.archive.resonances.getCount.useQuery(
    { oracleId },
    { enabled: !!oracleId },
  );

<<<<<<< HEAD
  // Check if user has resonated (protected)
  const { data: isResonatedData } = trpc.archive.resonances.isResonated.useQuery(
    { oracleId },
    { enabled: !!oracleId && !!user },
  );

  // Mutations
  const addMutation = trpc.archive.resonances.add.useMutation({
    onSuccess: () => {
      setIsResonated(true);
      utils.archive.resonances.isResonated.invalidate({ oracleId });
      utils.archive.resonances.getCount.invalidate({ oracleId });
      utils.archive.resonances.getUserResonated.invalidate();
=======
  const { data: isResonatedData } =
    trpc.archive.resonances.isResonated.useQuery(
      { oracleId },
      { enabled: !!oracleId && !!user },
    );

  const addMutation = trpc.archive.resonances.add.useMutation({
    onSuccess: () => {
      setIsResonated(true);
      setCount((c) => c + 1);
      utils.archive.resonances.isResonated.invalidate({ oracleId });
      utils.archive.resonances.getCount.invalidate({ oracleId });
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
    },
  });

  const removeMutation = trpc.archive.resonances.remove.useMutation({
    onSuccess: () => {
      setIsResonated(false);
<<<<<<< HEAD
      utils.archive.resonances.isResonated.invalidate({ oracleId });
      utils.archive.resonances.getCount.invalidate({ oracleId });
      utils.archive.resonances.getUserResonated.invalidate();
    },
  });

  // Update state from queries (server returns bare number/boolean)
=======
      setCount((c) => Math.max(0, c - 1));
      utils.archive.resonances.isResonated.invalidate({ oracleId });
      utils.archive.resonances.getCount.invalidate({ oracleId });
    },
  });

>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
  useEffect(() => {
    if (countData !== undefined) {
      setCount(typeof countData === "number" ? countData : 0);
    }
  }, [countData]);

  useEffect(() => {
    if (isResonatedData !== undefined) {
<<<<<<< HEAD
      setIsResonated(typeof isResonatedData === "boolean" ? isResonatedData : false);
=======
      setIsResonated(
        typeof isResonatedData === "boolean" ? isResonatedData : false,
      );
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
    }
  }, [isResonatedData]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
<<<<<<< HEAD

=======
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
<<<<<<< HEAD

=======
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
    if (isResonated) {
      removeMutation.mutate({ oracleId });
    } else {
      addMutation.mutate({ oracleId });
    }
  };

<<<<<<< HEAD
  // Calculate signal strength
  const getBarCount = () => {
=======
  const getBarCount = () => {
    if (count <= 0) return 0;
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
    if (count <= 4) return 1;
    if (count <= 9) return 2;
    if (count <= 19) return 3;
    return 4;
  };

<<<<<<< HEAD
  const sizeConfig = {
    sm: {
      button: "w-7 h-7",
      icon: 14,
      glyph: "◉",
    },
    md: {
      button: "w-9 h-9",
      icon: 18,
      glyph: "◉",
    },
  };

  const config = sizeConfig[size];
=======
  const btnSize = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const iconSize = size === "sm" ? 14 : 18;
  const barH = size === "sm" ? 6 : 8;
  const barW = size === "sm" ? 2 : 3;
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)

  return (
    <motion.div
      className="flex items-center gap-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
<<<<<<< HEAD
      {/* Resonance button */}
      <motion.button
        onClick={handleClick}
        disabled={addMutation.isPending || removeMutation.isPending}
        className={`${config.button} relative rounded-full transition-all duration-300 flex items-center justify-center`}
        style={{
          border: isResonated ? `1px solid ${temporalColor}` : `1px solid ${temporalColor}44`,
=======
      <motion.button
        onClick={handleClick}
        disabled={addMutation.isPending || removeMutation.isPending}
        className={`${btnSize} relative rounded-full transition-all duration-300 flex items-center justify-center`}
        style={{
          border: isResonated
            ? `1px solid ${temporalColor}`
            : `1px solid ${temporalColor}44`,
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
          background: isResonated
            ? `${temporalColor}22`
            : `${temporalColor}08`,
        }}
<<<<<<< HEAD
        animate={isResonated ? { boxShadow: [
          `0 0 10px ${temporalColor}00`,
          `0 0 20px ${temporalColor}44`,
          `0 0 10px ${temporalColor}00`,
        ] } : {}}
=======
        animate={
          isResonated
            ? {
                boxShadow: [
                  `0 0 10px ${temporalColor}00`,
                  `0 0 20px ${temporalColor}44`,
                  `0 0 10px ${temporalColor}00`,
                ],
              }
            : {}
        }
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
        transition={isResonated ? { duration: 2, repeat: Infinity } : {}}
      >
        <div
          style={{
<<<<<<< HEAD
            fontSize: config.icon,
=======
            fontSize: iconSize,
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
            color: isResonated ? temporalColor : `${temporalColor}66`,
            opacity: isResonated ? 1 : 0.5,
            transition: "all 0.3s ease",
          }}
        >
<<<<<<< HEAD
          {config.glyph}
        </div>
      </motion.button>

      {/* Count + signal strength */}
=======
          ◉
        </div>
      </motion.button>

>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
      {count > 0 && (
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="font-mono text-xs"
            style={{ color: temporalColor, letterSpacing: "0.05em" }}
          >
            {count}
          </div>
<<<<<<< HEAD

          {/* Signal strength bars */}
          <div className="flex gap-0.5">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="rounded-px"
                style={{
                  width: size === "sm" ? 2 : 3,
                  height: size === "sm" ? 6 : 8,
                  background:
                    i < getBarCount()
                      ? temporalColor
                      : `${temporalColor}22`,
                }}
                animate={i < getBarCount() ? {
                  opacity: [0.6, 1, 0.6],
                } : {}}
                transition={i < getBarCount() ? {
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                } : {}}
=======
          <div className="flex gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: barW,
                  height: barH,
                  borderRadius: 1,
                  background:
                    i < getBarCount() ? temporalColor : `${temporalColor}22`,
                  transition: "background 0.3s ease",
                }}
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
