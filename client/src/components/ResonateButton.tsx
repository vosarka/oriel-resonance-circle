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
=======
  // Get resonance count (public)
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
  const { data: countData } = trpc.archive.resonances.getCount.useQuery(
    { oracleId },
    { enabled: !!oracleId },
  );

<<<<<<< HEAD
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
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
    },
  });

  const removeMutation = trpc.archive.resonances.remove.useMutation({
    onSuccess: () => {
      setIsResonated(false);
<<<<<<< HEAD
      setCount((c) => Math.max(0, c - 1));
      utils.archive.resonances.isResonated.invalidate({ oracleId });
      utils.archive.resonances.getCount.invalidate({ oracleId });
    },
  });

=======
      utils.archive.resonances.isResonated.invalidate({ oracleId });
      utils.archive.resonances.getCount.invalidate({ oracleId });
      utils.archive.resonances.getUserResonated.invalidate();
    },
  });

  // Update state from queries (server returns bare number/boolean)
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
  useEffect(() => {
    if (countData !== undefined) {
      setCount(typeof countData === "number" ? countData : 0);
    }
  }, [countData]);

  useEffect(() => {
    if (isResonatedData !== undefined) {
<<<<<<< HEAD
      setIsResonated(
        typeof isResonatedData === "boolean" ? isResonatedData : false,
      );
=======
      setIsResonated(typeof isResonatedData === "boolean" ? isResonatedData : false);
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
    }
  }, [isResonatedData]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
<<<<<<< HEAD
=======

>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
<<<<<<< HEAD
=======

>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
    if (isResonated) {
      removeMutation.mutate({ oracleId });
    } else {
      addMutation.mutate({ oracleId });
    }
  };

<<<<<<< HEAD
  const getBarCount = () => {
    if (count <= 0) return 0;
=======
  // Calculate signal strength
  const getBarCount = () => {
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
    if (count <= 4) return 1;
    if (count <= 9) return 2;
    if (count <= 19) return 3;
    return 4;
  };

<<<<<<< HEAD
  const btnSize = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const iconSize = size === "sm" ? 14 : 18;
  const barH = size === "sm" ? 6 : 8;
  const barW = size === "sm" ? 2 : 3;
=======
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
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db

  return (
    <motion.div
      className="flex items-center gap-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
<<<<<<< HEAD
      <motion.button
        onClick={handleClick}
        disabled={addMutation.isPending || removeMutation.isPending}
        className={`${btnSize} relative rounded-full transition-all duration-300 flex items-center justify-center`}
        style={{
          border: isResonated
            ? `1px solid ${temporalColor}`
            : `1px solid ${temporalColor}44`,
=======
      {/* Resonance button */}
      <motion.button
        onClick={handleClick}
        disabled={addMutation.isPending || removeMutation.isPending}
        className={`${config.button} relative rounded-full transition-all duration-300 flex items-center justify-center`}
        style={{
          border: isResonated ? `1px solid ${temporalColor}` : `1px solid ${temporalColor}44`,
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
          background: isResonated
            ? `${temporalColor}22`
            : `${temporalColor}08`,
        }}
<<<<<<< HEAD
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
        animate={isResonated ? { boxShadow: [
          `0 0 10px ${temporalColor}00`,
          `0 0 20px ${temporalColor}44`,
          `0 0 10px ${temporalColor}00`,
        ] } : {}}
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
        transition={isResonated ? { duration: 2, repeat: Infinity } : {}}
      >
        <div
          style={{
<<<<<<< HEAD
            fontSize: iconSize,
=======
            fontSize: config.icon,
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
            color: isResonated ? temporalColor : `${temporalColor}66`,
            opacity: isResonated ? 1 : 0.5,
            transition: "all 0.3s ease",
          }}
        >
<<<<<<< HEAD
          ◉
        </div>
      </motion.button>

=======
          {config.glyph}
        </div>
      </motion.button>

      {/* Count + signal strength */}
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
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
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
