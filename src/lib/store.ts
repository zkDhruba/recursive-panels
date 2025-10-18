// store.ts
import { makeAutoObservable, observable } from "mobx";
import type { Node, LeafNode, SplitNode, Dir } from "./types";

const randColor = () => `hsl(${Math.floor(Math.random() * 360)} 70% 50%)`;
const uid = () => Math.random().toString(36).slice(2, 9);

const makeLeaf = (color = randColor()): LeafNode =>
  observable.object({ id: uid(), kind: "leaf" as const, color });

const makeSplit = (dir: Dir, a: Node, b: Node, ratio = 0.5): SplitNode =>
  observable.object({ id: uid(), kind: "split" as const, dir, ratio, a, b });

export class PaneStore {
  root: Node = makeLeaf();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get leafCount() {
    return this.countLeaves(this.root);
  }

  split(nodeId: string, dir: Dir) {
    console.log("[split]", { nodeId, dir });
    const path = this.findPath(nodeId);
    if (!path) return;
    const target = path[path.length - 1].node;
    if (target.kind !== "leaf") return;

    const existing = target; // already observable
    const replacement = makeSplit(dir, existing, makeLeaf(), 0.5);
    this.replaceAtPath(path, replacement);
  }

  remove(nodeId: string) {
    if (this.leafCount <= 1) return;
    const path = this.findPath(nodeId);
    if (!path) return;
    if (path.length === 1) return; // root leaf

    const parent = path[path.length - 2].node as SplitNode;
    const sibling = parent.a.id === nodeId ? parent.b : parent.a;
    // sibling is already an observable node (no wrapping needed)
    this.replaceAtPath(path.slice(0, -1), sibling);
  }

  resize(splitId: string, nextRatio: number) {
    const path = this.findPath(splitId);
    if (!path) return;
    const node = path[path.length - 1].node;
    if (node.kind !== "split") return;
    const marks = [0.25, 0.5, 0.75];
    const EPS = 0.02;
    const snap = marks.find((m) => Math.abs(nextRatio - m) <= EPS);
    const snapped = snap ?? nextRatio;
    node.ratio = Math.max(0.1, Math.min(0.9, snapped)); // observable write
  }

  // --- helpers unchanged (countLeaves, replaceAtPath, findPath) ---
  private countLeaves(n: Node): number {
    return n.kind === "leaf"
      ? 1
      : this.countLeaves(n.a) + this.countLeaves(n.b);
  }
  private replaceAtPath(path: { id: string; node: Node }[], replacement: Node) {
    if (path.length === 1) {
      this.root = replacement;
      return;
    }
    const parent = path[path.length - 2].node as SplitNode;
    const targetId = path[path.length - 1].id;
    if (parent.a.id === targetId) parent.a = replacement;
    else parent.b = replacement;
  }
  private findPath(id: string) {
    const stack: { id: string; node: Node }[] = [];
    const dfs = (n: Node): boolean => {
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

export const paneStore = new PaneStore();
