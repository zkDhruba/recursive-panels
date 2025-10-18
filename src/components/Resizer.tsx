import React, { useState, useRef, useEffect } from "react";

interface ResizerProps {
  direction: "vertical" | "horizontal";
  onResize: (ratio: number) => void;
  initialRatio: number;
}

export const Resizer: React.FC<ResizerProps> = ({
  direction,
  onResize,
  initialRatio,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const container = containerRef.current.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let ratio: number;

      if (direction === "vertical") {
        ratio = (e.clientX - rect.left) / rect.width;
      } else {
        ratio = (e.clientY - rect.top) / rect.height;
      }

      // Clamp between 0.1 and 0.9
      ratio = Math.max(0.1, Math.min(0.9, ratio));

      // Optional: Snap to 1/4, 1/2, 3/4
      const snapPoints = [0.25, 0.5, 0.75];
      const snapThreshold = 0.03;
      for (const snap of snapPoints) {
        if (Math.abs(ratio - snap) < snapThreshold) {
          ratio = snap;
          break;
        }
      }

      onResize(ratio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, direction, onResize]);

  return (
    <div
      ref={containerRef}
      className={`
        absolute z-10 bg-gray-800 transition-colors
        ${
          direction === "vertical"
            ? "w-1 h-full cursor-col-resize hover:bg-gray-600"
            : "h-1 w-full cursor-row-resize hover:bg-gray-600"
        }
        ${isDragging ? "bg-gray-600" : ""}
      `}
      style={
        direction === "vertical"
          ? { left: `${initialRatio * 100}%`, transform: "translateX(-50%)" }
          : { top: `${initialRatio * 100}%`, transform: "translateY(-50%)" }
      }
      onMouseDown={() => setIsDragging(true)}
    />
  );
};
