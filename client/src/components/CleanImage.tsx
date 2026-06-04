import { useEffect, useState } from "react";

interface CleanImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  mode: "remove-checkers" | "remove-black" | "none";
}

export default function CleanImage({
  src,
  alt,
  className,
  style,
  mode,
}: CleanImageProps) {
  const [cleanSrc, setCleanSrc] = useState(src);

  useEffect(() => {
    if (mode === "none") {
      setCleanSrc(src);
      return;
    }

    const img = new Image();
    img.src = src;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (mode === "remove-checkers") {
            // Checkers are neutral white (~255) and gray (~204)
            const maxDiff = Math.max(
              Math.abs(r - g),
              Math.abs(g - b),
              Math.abs(r - b)
            );
            if (maxDiff < 30) {
              data[i + 3] = 0; // Alpha to 0 (fully transparent)
            }
          } else if (mode === "remove-black") {
            // Remove pure black/dark neutral background
            const maxVal = Math.max(r, g, b);
            const maxDiff = Math.max(
              Math.abs(r - g),
              Math.abs(g - b),
              Math.abs(r - b)
            );
            if (maxVal < 45) {
              data[i + 3] = 0;
            } else if (maxDiff < 15 && maxVal < 70) {
              data[i + 3] = 0;
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        setCleanSrc(canvas.toDataURL());
      } catch (e) {
        console.error("CleanImage processing failed:", e);
        setCleanSrc(src);
      }
    };
    img.onerror = () => {
      setCleanSrc(src);
    };
  }, [src, mode]);

  return <img src={cleanSrc} alt={alt} className={className} style={style} />;
}
