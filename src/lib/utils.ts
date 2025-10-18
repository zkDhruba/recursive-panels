import { PaneData } from "./types";

// Utility to generate random colors
export const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`;
};

// Generate unique IDs
let idCounter = 0;
export const generateId = () => `pane-${idCounter++}`;

// Create initial pane
export const createPane = (color?: string): PaneData => ({
  id: generateId(),
  color: color || getRandomColor(),
  split: null,
  splitRatio: 0.5,
});
