import { useState } from "react";
import { PaneData, SplitDirection } from "./types";
import { createPane, generateId } from "./utils";

export const usePaneStore = (initialPane: PaneData) => {
  const [root, setRoot] = useState<PaneData>(initialPane);

  const splitPane = (id: string, direction: SplitDirection) => {
    if (!direction) return;

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

  return {
    root,
    splitPane,
    removePane,
    resizePane,
  };
};
