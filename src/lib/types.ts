export type SplitDirection = "vertical" | "horizontal" | null;

export interface PaneData {
  id: string;
  color: string;
  split: SplitDirection;
  splitRatio: number;
  children?: [PaneData, PaneData];
}
