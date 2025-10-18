import React, { useState, useRef, useEffect } from "react";

// Utility to generate random colors
const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`;
};

// Types
type SplitDirection = "vertical" | "horizontal" | null;

interface PaneData {
  id: string;
  color: string;
  split: SplitDirection;
  splitRatio: number;
  children?: [PaneData, PaneData];
}

// Generate unique IDs
let idCounter = 0;
const generateId = () => `pane-${idCounter++}`;

// Create initial pane
const createPane = (color?: string): PaneData => ({
  id: generateId(),
  color: color || getRandomColor(),
  split: null,
  splitRatio: 0.5,
});

// Resizer component
const Resizer: React.FC<{
  direction: "vertical" | "horizontal";
  onResize: (ratio: number) => void;
  initialRatio: number;
}> = ({ direction, onResize, initialRatio }) => {
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

// Pane component
const Pane: React.FC<{
  data: PaneData;
  onSplit: (id: string, direction: "vertical" | "horizontal") => void;
  onRemove: (id: string) => void;
  onResize: (id: string, ratio: number) => void;
  canRemove: boolean;
}> = ({ data, onSplit, onRemove, onResize, canRemove }) => {
  if (data.split && data.children) {
    const [first, second] = data.children;
    const isVertical = data.split === "vertical";

    return (
      <div className="relative w-full h-full">
        <div
          className="absolute"
          style={
            isVertical
              ? {
                  left: 0,
                  top: 0,
                  width: `${data.splitRatio * 100}%`,
                  height: "100%",
                }
              : {
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: `${data.splitRatio * 100}%`,
                }
          }
        >
          <Pane
            data={first}
            onSplit={onSplit}
            onRemove={onRemove}
            onResize={onResize}
            canRemove={true}
          />
        </div>

        <Resizer
          direction={data.split}
          initialRatio={data.splitRatio}
          onResize={(ratio) => onResize(data.id, ratio)}
        />

        <div
          className="absolute"
          style={
            isVertical
              ? {
                  left: `${data.splitRatio * 100}%`,
                  top: 0,
                  width: `${(1 - data.splitRatio) * 100}%`,
                  height: "100%",
                }
              : {
                  left: 0,
                  top: `${data.splitRatio * 100}%`,
                  width: "100%",
                  height: `${(1 - data.splitRatio) * 100}%`,
                }
          }
        >
          <Pane
            data={second}
            onSplit={onSplit}
            onRemove={onRemove}
            onResize={onResize}
            canRemove={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full flex items-center justify-center transition-colors"
      style={{ backgroundColor: data.color }}
    >
      <div className="flex gap-2">
        <button
          onClick={() => onSplit(data.id, "vertical")}
          className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded font-bold text-white backdrop-blur-sm transition-all"
        >
          V
        </button>
        <button
          onClick={() => onSplit(data.id, "horizontal")}
          className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded font-bold text-white backdrop-blur-sm transition-all"
        >
          H
        </button>
        {canRemove && (
          <button
            onClick={() => onRemove(data.id)}
            className="px-4 py-2 bg-red-500 bg-opacity-70 hover:bg-opacity-90 rounded font-bold text-white backdrop-blur-sm transition-all"
          >
            −
          </button>
        )}
      </div>
    </div>
  );
};

// Main App
export default function App() {
  const [root, setRoot] = useState<PaneData>(() => createPane());

  const splitPane = (id: string, direction: "vertical" | "horizontal") => {
    const updatePanes = (pane: PaneData): PaneData => {
      if (pane.id === id) {
        return {
          ...pane,
          split: direction,
          splitRatio: 0.5,
          children: [
            { ...pane, id: generateId(), split: null, children: undefined },
            createPane(),
          ],
        };
      }
      if (pane.children) {
        return {
          ...pane,
          children: [
            updatePanes(pane.children[0]),
            updatePanes(pane.children[1]),
          ],
        };
      }
      return pane;
    };

    setRoot(updatePanes(root));
  };

  const removePane = (id: string) => {
    const removePaneRecursive = (pane: PaneData): PaneData | null => {
      if (pane.children) {
        const [first, second] = pane.children;

        if (first.id === id) {
          return second;
        }
        if (second.id === id) {
          return first;
        }

        const newFirst = removePaneRecursive(first);
        const newSecond = removePaneRecursive(second);

        if (newFirst === null) return newSecond;
        if (newSecond === null) return newFirst;

        return {
          ...pane,
          children: [newFirst, newSecond],
        };
      }
      return pane;
    };

    const newRoot = removePaneRecursive(root);
    if (newRoot) {
      setRoot(newRoot);
    }
  };

  const resizePane = (id: string, ratio: number) => {
    const updatePanes = (pane: PaneData): PaneData => {
      if (pane.id === id) {
        return { ...pane, splitRatio: ratio };
      }
      if (pane.children) {
        return {
          ...pane,
          children: [
            updatePanes(pane.children[0]),
            updatePanes(pane.children[1]),
          ],
        };
      }
      return pane;
    };

    setRoot(updatePanes(root));
  };

  return (
    <div className="w-screen h-screen overflow-hidden">
      <Pane
        data={root}
        onSplit={splitPane}
        onRemove={removePane}
        onResize={resizePane}
        canRemove={false}
      />
    </div>
  );
}
