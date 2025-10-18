// App.jsx
import React, { useMemo, useRef, useState } from "react";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";

/* =========================
   Helpers / data "types"
   ========================= */
// Node shape (no TS):
// Leaf:  { id, kind: 'leaf', color }
// Split: { id, kind: 'split', dir: 'v'|'h', ratio: number, a: Node, b: Node }

const randColor = () => `hsl(${Math.floor(Math.random() * 360)} 70% 50%)`;
const uid = () => Math.random().toString(36).slice(2, 9);

/* =========================
   MobX Store
   ========================= */
class PaneStore {
  root;

  constructor() {
    // start with a single random-colored leaf
    this.root = { id: uid(), kind: "leaf", color: randColor() };
    makeAutoObservable(this);
  }

  split(nodeId, dir /* 'v' or 'h' */) {
    const path = this.findPath(nodeId);
    if (!path) return;
    const target = path[path.length - 1].node;
    if (target.kind !== "leaf") return;

    // existing leaf keeps color; new leaf gets a new color
    const existing = target;
    const newLeaf = { id: uid(), kind: "leaf", color: randColor() };

    const replacement = {
      id: uid(),
      kind: "split",
      dir,
      ratio: 0.5,
      a: existing,
      b: newLeaf,
    };

    this.replaceAtPath(path, replacement);
  }

  remove(nodeId) {
    if (this.countLeaves(this.root) <= 1) return; // keep at least one

    const path = this.findPath(nodeId);
    if (!path) return;
    const target = path[path.length - 1].node;
    if (target.kind !== "leaf") return;

    if (path.length === 1) return; // it's the root; do nothing

    // replace parent with sibling
    const parentPath = path.slice(0, -1);
    const parent = parentPath[parentPath.length - 1].node;
    if (parent.kind !== "split") return;

    const sibling = parent.a.id === nodeId ? parent.b : parent.a;
    this.replaceAtPath(parentPath, sibling);
  }

  resize(splitId, nextRatio) {
    const path = this.findPath(splitId);
    if (!path) return;
    const node = path[path.length - 1].node;
    if (node.kind !== "split") return;

    const snapped = this.snapRatio(nextRatio);
    node.ratio = Math.max(0.1, Math.min(0.9, snapped)); // clamp so panes don't vanish
  }

  // ---- helpers ----
  snapRatio(x) {
    const marks = [0.25, 0.5, 0.75];
    const EPS = 0.02; // snap within ±2%
    for (const m of marks) if (Math.abs(x - m) <= EPS) return m;
    return x;
  }

  countLeaves(n) {
    return n.kind === "leaf"
      ? 1
      : this.countLeaves(n.a) + this.countLeaves(n.b);
  }

  replaceAtPath(path, replacement) {
    if (path.length === 1) {
      this.root = replacement;
      return;
    }
    const parent = path[path.length - 2].node; // should be split
    const targetId = path[path.length - 1].id;
    if (parent.a.id === targetId) parent.a = replacement;
    else parent.b = replacement;
  }

  findPath(id) {
    const stack = [];
    const dfs = (n) => {
      stack.push({ id: n.id, node: n });
      if (n.id === id) return true;
      if (n.kind === "split") {
        if (dfs(n.a)) return true;
        if (dfs(n.b)) return true;
      }
      stack.pop();
      return false;
    };
    return dfs(this.root) ? stack : null;
  }
}

const paneStore = new PaneStore();

/* =========================
   UI Components
   ========================= */

// Top-level view
const PaneView = observer(function PaneView() {
  const containerRef = useRef(null);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold text-white">
        Recursive Partitioning
      </h1>

      <div
        ref={containerRef}
        className="relative h-[80vh] w-full overflow-hidden rounded-2xl border border-neutral-700/40 bg-neutral-900"
      >
        <NodeView
          node={paneStore.root}
          rect={{ x: 0, y: 0, w: 1, h: 1 }}
          containerRef={containerRef}
        />
      </div>

      <p className="mt-3 text-sm text-white/70">
        Click <kbd>v</kbd> or <kbd>h</kbd> to split. Drag the divider to resize
        (snaps at 25%, 50%, 75%). Use <kbd>-</kbd> to remove a pane.
      </p>
    </div>
  );
});

// Renders either a leaf or a split recursively
const NodeView = observer(function NodeView({ node, rect, containerRef }) {
  if (node.kind === "leaf") {
    const leaves = useMemo(
      () => paneStore.countLeaves(paneStore.root),
      [paneStore.root]
    );

    return (
      <div
        className="absolute"
        style={{
          left: `${rect.x * 100}%`,
          top: `${rect.y * 100}%`,
          width: `${rect.w * 100}%`,
          height: `${rect.h * 100}%`,
          background: node.color,
        }}
      >
        {/* Controls */}
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            onClick={() => paneStore.split(node.id, "v")}
            className="rounded-md bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/60"
            title="Split vertically"
          >
            v
          </button>
          <button
            onClick={() => paneStore.split(node.id, "h")}
            className="rounded-md bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/60"
            title="Split horizontally"
          >
            h
          </button>
          <button
            onClick={() => paneStore.remove(node.id)}
            disabled={leaves <= 1}
            className="rounded-md bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/60 disabled:opacity-40"
            title="Remove pane"
          >
            -
          </button>
        </div>
      </div>
    );
  }

  // split node: compute child rects from dir + ratio
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

// Draggable divider (handles mouse + touch)
const Divider = observer(function Divider({ node, rect, containerRef }) {
  const draggingRef = useRef(false);
  const [hover, setHover] = useState(false);

  const onDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    window.addEventListener("mousemove", onMoveMouse);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMoveTouch, { passive: false });
    window.addEventListener("touchend", onUp);
  };

  const measure = () => containerRef.current?.getBoundingClientRect();

  const applyRatioFromPoint = (clientX, clientY) => {
    const box = measure();
    if (!box) return;
    if (node.dir === "v") {
      const px = clientX - box.left;
      const ratio = Math.max(0, Math.min(1, px / box.width));
      paneStore.resize(node.id, ratio);
    } else {
      const py = clientY - box.top;
      const ratio = Math.max(0, Math.min(1, py / box.height));
      paneStore.resize(node.id, ratio);
    }
  };

  const onMoveMouse = (e) => {
    if (!draggingRef.current) return;
    applyRatioFromPoint(e.clientX, e.clientY);
  };

  const onMoveTouch = (e) => {
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

  return (
    <div
      className="absolute z-10 bg-white/40"
      style={style}
      onMouseDown={onDown}
      onTouchStart={onDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Drag to resize (snaps to 1/4, 1/2, 3/4)"
    >
      {/* Thicker hit area for easier grabbing */}
      <div
        className={`absolute ${
          node.dir === "v" ? "-left-2 w-4 h-full" : "-top-2 h-4 w-full"
        } ${hover ? "bg-white/10" : ""}`}
      />
    </div>
  );
});

/* =========================
   App shell
   ========================= */
function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <PaneView />
    </div>
  );
}

export default App;
