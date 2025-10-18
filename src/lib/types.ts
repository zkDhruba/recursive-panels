export type Dir = "v" | "h";

export type LeafNode = {
  id: string;
  kind: "leaf";
  color: string;
};

export type SplitNode = {
  id: string;
  kind: "split";
  dir: Dir; // 'v' = vertical divider (left/right), 'h' = horizontal (top/bottom)
  ratio: number; // 0..1 => portion of the first child
  a: Node;
  b: Node;
};

export type Node = LeafNode | SplitNode;
