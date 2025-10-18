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
  const [currentRatio, setCurrentRatio] = useState(initialRatio);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentRatio(initialRatio);
  }, [initialRatio]);

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

      setCurrentRatio(ratio);
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

  const percentage = Math.round(currentRatio * 100);

  return (
    <>
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
            ? { left: `${currentRatio * 100}%`, transform: "translateX(-50%)" }
            : { top: `${currentRatio * 100}%`, transform: "translateY(-50%)" }
        }
        onMouseDown={() => setIsDragging(true)}
      />

      {isDragging && (
        <div
          className="absolute z-20 bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-semibold pointer-events-none shadow-lg"
          style={
            direction === "vertical"
              ? {
                  left: `${currentRatio * 100}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }
              : {
                  left: "50%",
                  top: `${currentRatio * 100}%`,
                  transform: "translate(-50%, -50%)",
                }
          }
        >
          {percentage}%
        </div>
      )}
    </>
  );
};
