import { makeAutoObservable } from "mobx";
import type { Node, LeafNode, SplitNode, Dir } from "./types";

const randColor = () => `hsl(${Math.floor(Math.random() * 360)} 70% 50%)`;
const uid = () => Math.random().toString(36).slice(2, 9);

export class PaneStore {
  root: Node;

  constructor() {
    this.root = { id: uid(), kind: "leaf", color: randColor() };
    makeAutoObservable(this);
  }

  split(nodeId: string, dir: Dir) {
    const path = this.findPath(nodeId);
    if (!path) return;
    const target = path[path.length - 1].node;
    if (target.kind !== "leaf") return;

    const existing = target as LeafNode; // keep old color
    const newLeaf: LeafNode = { id: uid(), kind: "leaf", color: randColor() };

    const replacement: SplitNode = {
      id: uid(),
      kind: "split",
      dir,
      ratio: 0.5,
      a: existing,
      b: newLeaf,
    };

    this.replaceAtPath(path, replacement);
  }

  remove(nodeId: string) {
    if (this.countLeaves(this.root) <= 1) return; // keep at least one

    const path = this.findPath(nodeId);
    if (!path) return;
    const target = path[path.length - 1].node;
    if (target.kind !== "leaf") return;

    if (path.length === 1) return; // target is root

    const parentPath = path.slice(0, -1);
    const parent = parentPath[parentPath.length - 1].node;
    if (parent.kind !== "split") return;

    const sibling = parent.a.id === nodeId ? parent.b : parent.a;
    this.replaceAtPath(parentPath, sibling);
  }

  resize(splitId: string, nextRatio: number) {
    const path = this.findPath(splitId);
    if (!path) return;
    const node = path[path.length - 1].node;
    if (node.kind !== "split") return;

    const snapped = this.snapRatio(nextRatio);
    node.ratio = Math.max(0.1, Math.min(0.9, snapped)); // keep some min size
  }

  // ---- helpers ----

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

  private snapRatio(x: number) {
    const marks = [0.25, 0.5, 0.75];
    const EPS = 0.02; // 2% snap window
    for (const m of marks) if (Math.abs(x - m) <= EPS) return m;
    return x;
  }
}

export const paneStore = new PaneStore();
