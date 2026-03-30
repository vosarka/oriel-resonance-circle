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
<<<<<<< HEAD
  // Get resonance count (public)
=======
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
=======
  // Get resonance count (public)
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
  const { data: countData } = trpc.archive.resonances.getCount.useQuery(
    { oracleId },
    { enabled: !!oracleId },
  );

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
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
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
    },
  });

  const removeMutation = trpc.archive.resonances.remove.useMutation({
    onSuccess: () => {
      setIsResonated(false);
<<<<<<< HEAD
<<<<<<< HEAD
=======
      setCount((c) => Math.max(0, c - 1));
      utils.archive.resonances.isResonated.invalidate({ oracleId });
      utils.archive.resonances.getCount.invalidate({ oracleId });
    },
  });

=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
      utils.archive.resonances.isResonated.invalidate({ oracleId });
      utils.archive.resonances.getCount.invalidate({ oracleId });
      utils.archive.resonances.getUserResonated.invalidate();
    },
  });

  // Update state from queries (server returns bare number/boolean)
<<<<<<< HEAD
=======
      setCount((c) => Math.max(0, c - 1));
      utils.archive.resonances.isResonated.invalidate({ oracleId });
      utils.archive.resonances.getCount.invalidate({ oracleId });
    },
  });

>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
  useEffect(() => {
    if (countData !== undefined) {
      setCount(typeof countData === "number" ? countData : 0);
    }
  }, [countData]);

  useEffect(() => {
    if (isResonatedData !== undefined) {
<<<<<<< HEAD
<<<<<<< HEAD
      setIsResonated(typeof isResonatedData === "boolean" ? isResonatedData : false);
=======
      setIsResonated(
        typeof isResonatedData === "boolean" ? isResonatedData : false,
      );
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
      setIsResonated(
        typeof isResonatedData === "boolean" ? isResonatedData : false,
      );
=======
      setIsResonated(typeof isResonatedData === "boolean" ? isResonatedData : false);
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
    }
  }, [isResonatedData]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
<<<<<<< HEAD
<<<<<<< HEAD

=======
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
=======

>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
<<<<<<< HEAD
<<<<<<< HEAD

=======
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
=======

>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
    if (isResonated) {
      removeMutation.mutate({ oracleId });
    } else {
      addMutation.mutate({ oracleId });
    }
  };

<<<<<<< HEAD
<<<<<<< HEAD
  // Calculate signal strength
  const getBarCount = () => {
=======
  const getBarCount = () => {
    if (count <= 0) return 0;
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
  const getBarCount = () => {
    if (count <= 0) return 0;
=======
  // Calculate signal strength
  const getBarCount = () => {
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
    if (count <= 4) return 1;
    if (count <= 9) return 2;
    if (count <= 19) return 3;
    return 4;
  };

<<<<<<< HEAD
<<<<<<< HEAD
=======
  const btnSize = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const iconSize = size === "sm" ? 14 : 18;
  const barH = size === "sm" ? 6 : 8;
  const barW = size === "sm" ? 2 : 3;
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
=======
  const btnSize = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const iconSize = size === "sm" ? 14 : 18;
  const barH = size === "sm" ? 6 : 8;
  const barW = size === "sm" ? 2 : 3;
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d

  return (
    <motion.div
      className="flex items-center gap-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
<<<<<<< HEAD
<<<<<<< HEAD
=======
      <motion.button
        onClick={handleClick}
        disabled={addMutation.isPending || removeMutation.isPending}
        className={`${btnSize} relative rounded-full transition-all duration-300 flex items-center justify-center`}
        style={{
          border: isResonated
            ? `1px solid ${temporalColor}`
            : `1px solid ${temporalColor}44`,
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
      {/* Resonance button */}
      <motion.button
        onClick={handleClick}
        disabled={addMutation.isPending || removeMutation.isPending}
        className={`${config.button} relative rounded-full transition-all duration-300 flex items-center justify-center`}
        style={{
          border: isResonated ? `1px solid ${temporalColor}` : `1px solid ${temporalColor}44`,
<<<<<<< HEAD
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
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
          background: isResonated
            ? `${temporalColor}22`
            : `${temporalColor}08`,
        }}
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
        animate={isResonated ? { boxShadow: [
          `0 0 10px ${temporalColor}00`,
          `0 0 20px ${temporalColor}44`,
          `0 0 10px ${temporalColor}00`,
        ] } : {}}
<<<<<<< HEAD
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
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
        transition={isResonated ? { duration: 2, repeat: Infinity } : {}}
      >
        <div
          style={{
<<<<<<< HEAD
<<<<<<< HEAD
            fontSize: config.icon,
=======
            fontSize: iconSize,
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
            fontSize: iconSize,
=======
            fontSize: config.icon,
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
            color: isResonated ? temporalColor : `${temporalColor}66`,
            opacity: isResonated ? 1 : 0.5,
            transition: "all 0.3s ease",
          }}
        >
<<<<<<< HEAD
<<<<<<< HEAD
=======
          ◉
        </div>
      </motion.button>

=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
          {config.glyph}
        </div>
      </motion.button>

      {/* Count + signal strength */}
<<<<<<< HEAD
=======
          ◉
        </div>
      </motion.button>

>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
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
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d

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
<<<<<<< HEAD
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
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
