import { store } from "@/lib/store.svelte";

let currentIndex = $state(0);

const start = (index: number, event: DragEvent) => {
  currentIndex = index;
  (event.currentTarget as HTMLElement).classList.add("dragstart");

  const ghost = (event.currentTarget as HTMLElement).querySelector("summary");
  if (!ghost) return;

  event.dataTransfer?.setDragImage(ghost, 50, 50);
};

const end = (event: DragEvent) => {
  (event.currentTarget as HTMLElement).classList.remove("dragstart");
};

const over = (event: DragEvent) => {
  event.preventDefault();
  (event.currentTarget as HTMLElement).classList.add("dragover");
};
const leave = (event: DragEvent) => {
  (event.currentTarget as HTMLElement).classList.remove("dragover");
};
const ondrop = (index: number, event: DragEvent) => {
  event.preventDefault();
  (event.currentTarget as HTMLElement).classList.remove("dragover");
  if (index === currentIndex) return;

  const moveProject = { ...store.localProjectState[currentIndex] };
  store.localProjectState.splice(currentIndex, 1);

  if (currentIndex < index) {
    store.localProjectState.splice(index - 1, 0, moveProject);
  } else {
    store.localProjectState.splice(index, 0, moveProject);
  }
};

export default {
  start,
  end,
  over,
  leave,
  ondrop,
};
