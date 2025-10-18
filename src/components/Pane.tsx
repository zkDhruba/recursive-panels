import React from "react";
import { PaneData } from "../lib/types";
import { Resizer } from "./Resizer";

interface PaneProps {
  data: PaneData;
  onSplit: (id: string, direction: "vertical" | "horizontal") => void;
  onRemove: (id: string) => void;
  onResize: (id: string, ratio: number) => void;
  canRemove: boolean;
}

export const Pane: React.FC<PaneProps> = ({
  data,
  onSplit,
  onRemove,
  onResize,
  canRemove,
}) => {
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
      <div className="flex">
        <button
          onClick={() => onSplit(data.id, "vertical")}
          className="bg-white px-2 py-1 text-xs text-black border border-black/40 hover:border-black/60 hover:bg-slate-100 rounded-sm"
        >
          V
        </button>
        <button
          onClick={() => onSplit(data.id, "horizontal")}
          className="bg-white px-2 py-1 text-xs text-black border border-black/40 hover:border-black/60 hover:bg-slate-100 rounded-sm"
        >
          H
        </button>
        {canRemove && (
          <button
            onClick={() => onRemove(data.id)}
            className="bg-white px-2 py-1 text-xs text-black border border-black/40 hover:border-black/60 hover:bg-slate-100 rounded-sm"
          >
            −
          </button>
        )}
      </div>
    </div>
  );
};
