import React, { useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { paneStore } from "../lib/store";
import type { Node, SplitNode } from "../lib/types";

type Rect = { x: number; y: number; w: number; h: number }; // fractions 0..1

export const PaneView = observer(() => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  return (
    <div
      ref={containerRef}
      className="relative h-[100vh] w-full overflow-hidden border border-neutral-700/40 bg-neutral-900"
    >
      <NodeView
        node={paneStore.root}
        rect={{ x: 0, y: 0, w: 1, h: 1 }}
        containerRef={containerRef}
      />
    </div>
  );
});

const NodeView = observer(function NodeView({
  node,
  rect,
  containerRef,
}: {
  node: Node;
  rect: Rect;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  if (node.kind === "leaf") {
    // ⬇️ use the computed that depends on the observable tree
    const leaves = paneStore.leafCount;

    return (
      <div
        className="absolute"
        style={{
          left: `${rect.x * 100}%`,
          top: `${rect.y * 100}%`,
          width: `${rect.w * 100}%`,
          height: `${rect.h * 100}%`,
          background: node.color, // <— reading observable field
        }}
      >
        <div className="text-center flex items-center justify-center gap-2 h-full">
          <button
            onClick={() => paneStore.split(node.id, "v")}
            className="bg-white px-2 py-1 text-xs text-black border border-black/40 hover:border-black/60 hover:bg-slate-100 rounded-sm"
          >
            v
          </button>
          <button
            onClick={() => paneStore.split(node.id, "h")}
            className="bg-white px-2 py-1 text-xs text-black border border-black/40 hover:border-black/60 hover:bg-slate-100 rounded-sm"
          >
            h
          </button>
          {leaves > 1 && (
            <button
              onClick={() => paneStore.remove(node.id)}
              className="bg-white px-2 py-1 text-xs text-black border border-black/40 hover:border-black/60 hover:bg-slate-100 rounded-sm"
            >
              -
            </button>
          )}
        </div>
      </div>
    );
  }

  // split node
  const aRect =
    node.dir === "v"
      ? { x: rect.x, y: rect.y, w: rect.w * node.ratio, h: rect.h }
      : { x: rect.x, y: rect.y, w: rect.w, h: rect.h * node.ratio };

  const bRect =
    node.dir === "v"
      ? { x: rect.x + aRect.w, y: rect.y, w: rect.w - aRect.w, h: rect.h }
      : { x: rect.x, y: rect.y + aRect.h, w: rect.w, h: rect.h - aRect.h };

  return (
    <>
      <NodeView node={node.a} rect={aRect} containerRef={containerRef} />
      <Divider node={node} rect={rect} containerRef={containerRef} />
      <NodeView node={node.b} rect={bRect} containerRef={containerRef} />
    </>
  );
});

const Divider = observer(function Divider({
  node,
  rect,
  containerRef,
}: {
  node: SplitNode;
  rect: Rect;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const draggingRef = useRef(false);
  const [hover, setHover] = useState(false);

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    window.addEventListener("mousemove", onMoveMouse);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMoveTouch, { passive: false });
    window.addEventListener("touchend", onUp);
  };

  const measure = () => containerRef.current?.getBoundingClientRect();

  const applyRatioFromPoint = (clientX: number, clientY: number) => {
    const box = measure();
    if (!box) return;
    if (node.dir === "v") {
      const px = clientX - box.left;
      paneStore.resize(node.id, Math.max(0, Math.min(1, px / box.width)));
    } else {
      const py = clientY - box.top;
      paneStore.resize(node.id, Math.max(0, Math.min(1, py / box.height)));
    }
  };

  const onMoveMouse = (e: MouseEvent) => {
    if (!draggingRef.current) return;
    applyRatioFromPoint(e.clientX, e.clientY);
  };
  const onMoveTouch = (e: TouchEvent) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    const t = e.touches[0];
    if (t) applyRatioFromPoint(t.clientX, t.clientY);
  };
  const onUp = () => {
    draggingRef.current = false;
    window.removeEventListener("mousemove", onMoveMouse);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("touchmove", onMoveTouch);
    window.removeEventListener("touchend", onUp);
  };

  // uses observable node.ratio to position itself
  const style =
    node.dir === "v"
      ? {
          left: `${(rect.x + rect.w * node.ratio) * 100}%`,
          top: `${rect.y * 100}%`,
          width: "2px",
          height: `${rect.h * 100}%`,
          cursor: "col-resize",
        }
      : {
          left: `${rect.x * 100}%`,
          top: `${(rect.y + rect.h * node.ratio) * 100}%`,
          width: `${rect.w * 100}%`,
          height: "2px",
          cursor: "row-resize",
        };

  const percent = Math.round(node.ratio * 100);

  return (
    <div
      className="absolute z-10 bg-white/40"
      style={style as React.CSSProperties}
      onMouseDown={onDown}
      onTouchStart={onDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Drag to resize (snaps 25/50/75%)"
    >
      <div
        className={`absolute ${
          node.dir === "v" ? "-left-2 w-4 h-full" : "-top-2 h-4 w-full"
        } ${hover || draggingRef.current ? "bg-white/10" : ""}`}
      />
      {(hover || draggingRef.current) && (
        <div
          className={`absolute text-[10px] px-1 py-0.5 rounded bg-black/70 text-white ${
            node.dir === "v" ? "-top-6 -left-6" : "-left-10 -top-5"
          }`}
        >
          {percent}%
        </div>
      )}
    </div>
  );
});
