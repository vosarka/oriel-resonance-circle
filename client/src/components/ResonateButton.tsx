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

  const { data: countData } = trpc.archive.resonances.getCount.useQuery(
    { oracleId },
    { enabled: !!oracleId },
  );

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
    },
  });

  const removeMutation = trpc.archive.resonances.remove.useMutation({
    onSuccess: () => {
      setIsResonated(false);
      setCount((c) => Math.max(0, c - 1));
      utils.archive.resonances.isResonated.invalidate({ oracleId });
      utils.archive.resonances.getCount.invalidate({ oracleId });
    },
  });

  useEffect(() => {
    if (countData !== undefined) {
      setCount(typeof countData === "number" ? countData : 0);
    }
  }, [countData]);

  useEffect(() => {
    if (isResonatedData !== undefined) {
      setIsResonated(
        typeof isResonatedData === "boolean" ? isResonatedData : false,
      );
    }
  }, [isResonatedData]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    if (isResonated) {
      removeMutation.mutate({ oracleId });
    } else {
      addMutation.mutate({ oracleId });
    }
  };

  const getBarCount = () => {
    if (count <= 0) return 0;
    if (count <= 4) return 1;
    if (count <= 9) return 2;
    if (count <= 19) return 3;
    return 4;
  };

  const btnSize = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const iconSize = size === "sm" ? 14 : 18;
  const barH = size === "sm" ? 6 : 8;
  const barW = size === "sm" ? 2 : 3;

  return (
    <motion.div
      className="flex items-center gap-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.button
        onClick={handleClick}
        disabled={addMutation.isPending || removeMutation.isPending}
        className={`${btnSize} relative rounded-full transition-all duration-300 flex items-center justify-center`}
        style={{
          border: isResonated
            ? `1px solid ${temporalColor}`
            : `1px solid ${temporalColor}44`,
          background: isResonated
            ? `${temporalColor}22`
            : `${temporalColor}08`,
        }}
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
        transition={isResonated ? { duration: 2, repeat: Infinity } : {}}
      >
        <div
          style={{
            fontSize: iconSize,
            color: isResonated ? temporalColor : `${temporalColor}66`,
            opacity: isResonated ? 1 : 0.5,
            transition: "all 0.3s ease",
          }}
        >
          ◉
        </div>
      </motion.button>

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
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
