import { Pane } from "./components/Pane";
import { usePaneStore } from "./lib/store";
import { createPane } from "./lib/utils";

export default function App() {
  const { root, splitPane, removePane, resizePane } = usePaneStore(
    createPane()
  );

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
