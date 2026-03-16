import { useEffect, useRef } from "react";

const REFRESH_DURATION = 10000; // ms — how often points shift

// Voss Arkiva palette
const STROKE_COLOR = "189,163,107"; // gold
const FLASH_COLOR  = "rgba(91,164,164,0.14)"; // teal flash

interface Point {
  x: number;
  y: number;
  originX: number;
  originY: number;
}
interface PolyMeta {
  point1: number;
  point2: number;
  point3: number;
}

export default function GeometricBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Inject CSS for smooth polygon color transitions
    const style = document.createElement("style");
    style.textContent = `
      .geo-bg-svg polygon { transition: fill 5.5s ease, stroke 5.5s ease; }
    `;
    document.head.appendChild(style);

    let svg: SVGSVGElement | null = null;
    let refreshTimeout: ReturnType<typeof setTimeout>;
    let flashInterval: ReturnType<typeof setInterval>;
    let numPointsX = 0;
    let numPointsY = 0;
    let unitWidth  = 0;
    let unitHeight = 0;
    let points: Point[] = [];
    const meta: PolyMeta[] = [];

    function randomize() {
      for (const p of points) {
        if (p.originX !== 0 && p.originX !== unitWidth * (numPointsX - 1)) {
          p.x = p.originX + Math.random() * unitWidth  - unitWidth  / 2;
        }
        if (p.originY !== 0 && p.originY !== unitHeight * (numPointsY - 1)) {
          p.y = p.originY + Math.random() * unitHeight - unitHeight / 2;
        }
      }
    }

    function refresh() {
      if (!svg) return;
      randomize();
      const nodes = svg.childNodes;
      for (let i = 0; i < nodes.length; i++) {
        const poly    = nodes[i] as SVGPolygonElement;
        const animate = poly.firstChild as SVGAnimateElement | null;
        if (!animate || !meta[i]) continue;
        const { point1, point2, point3 } = meta[i];
        const to = `${points[point1].x},${points[point1].y} ${points[point2].x},${points[point2].y} ${points[point3].x},${points[point3].y}`;
        const prevTo = animate.getAttribute("to");
        if (prevTo) animate.setAttribute("from", prevTo);
        animate.setAttribute("to", to);
        animate.beginElement();
      }
      refreshTimeout = setTimeout(refresh, REFRESH_DURATION);
    }

    function build() {
      if (svg) { svg.remove(); svg = null; }
      meta.length = 0;

      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width",  String(window.innerWidth));
      svg.setAttribute("height", String(window.innerHeight));
      svg.classList.add("geo-bg-svg");
      svg.style.cssText = "position:fixed;inset:0;z-index:0;pointer-events:none;";
      container!.appendChild(svg);

      const unitSize = (window.innerWidth + window.innerHeight) / 20;
      numPointsX = Math.ceil(window.innerWidth  / unitSize) + 1;
      numPointsY = Math.ceil(window.innerHeight / unitSize) + 1;
      unitWidth  = Math.ceil(window.innerWidth  / (numPointsX - 1));
      unitHeight = Math.ceil(window.innerHeight / (numPointsY - 1));

      points = [];
      for (let y = 0; y < numPointsY; y++) {
        for (let x = 0; x < numPointsX; x++) {
          points.push({ x: unitWidth * x, y: unitHeight * y, originX: unitWidth * x, originY: unitHeight * y });
        }
      }

      randomize();

      for (let i = 0; i < points.length; i++) {
        if (
          points[i].originX === unitWidth  * (numPointsX - 1) ||
          points[i].originY === unitHeight * (numPointsY - 1)
        ) continue;

        const tlX = points[i].x,           tlY = points[i].y;
        const trX = points[i + 1].x,       trY = points[i + 1].y;
        const blX = points[i + numPointsX].x, blY = points[i + numPointsX].y;
        const brX = points[i + numPointsX + 1].x, brY = points[i + numPointsX + 1].y;
        const rando = Math.floor(Math.random() * 2);

        for (let n = 0; n < 2; n++) {
          let p1: number, p2: number, p3: number, pts: string;

          if (rando === 0) {
            if (n === 0) { p1 = i; p2 = i + numPointsX; p3 = i + numPointsX + 1; pts = `${tlX},${tlY} ${blX},${blY} ${brX},${brY}`; }
            else          { p1 = i; p2 = i + 1;          p3 = i + numPointsX + 1; pts = `${tlX},${tlY} ${trX},${trY} ${brX},${brY}`; }
          } else {
            if (n === 0) { p1 = i; p2 = i + numPointsX; p3 = i + 1;          pts = `${tlX},${tlY} ${blX},${blY} ${trX},${trY}`; }
            else          { p1 = i + numPointsX; p2 = i + 1; p3 = i + numPointsX + 1; pts = `${blX},${blY} ${trX},${trY} ${brX},${brY}`; }
          }

          const poly = document.createElementNS(svg!.namespaceURI!, "polygon");
          poly.setAttribute("points", pts!);
          poly.setAttribute("fill",   `rgba(0,0,0,${Math.random() / 5})`);
          poly.setAttribute("stroke", `rgba(${STROKE_COLOR},${Math.random() / 3})`);
          poly.setAttribute("stroke-width", "0.4");

          const anim = document.createElementNS(svg!.namespaceURI!, "animate");
          anim.setAttribute("fill", "freeze");
          anim.setAttribute("attributeName", "points");
          anim.setAttribute("dur", `${REFRESH_DURATION}ms`);
          anim.setAttribute("calcMode", "linear");
          poly.appendChild(anim);
          svg!.appendChild(poly);
          meta.push({ point1: p1!, point2: p2!, point3: p3! });
        }
      }

      // Occasional teal pulse on a random polygon
      flashInterval = setInterval(() => {
        if (!svg) return;
        const nodes = svg.childNodes;
        if (nodes.length === 0) return;
        const k    = Math.floor(Math.random() * nodes.length);
        const poly = nodes[k] as SVGPolygonElement;
        if (!poly) return;
        const prev = poly.getAttribute("fill") ?? "rgba(0,0,0,0)";
        poly.setAttribute("fill", FLASH_COLOR);
        setTimeout(() => poly.setAttribute("fill", prev), 600);
      }, 700);

      refresh();
    }

    function onResize() {
      clearTimeout(refreshTimeout);
      clearInterval(flashInterval);
      build();
    }

    build();
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(refreshTimeout);
      clearInterval(flashInterval);
      window.removeEventListener("resize", onResize);
      svg?.remove();
      style.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
