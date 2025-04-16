import { store } from "@/lib/store.svelte";

/**
 * Current index being dragged
 */
let currentIndex = $state(0);

/**
 * Handles drag start event
 * @param index - Index of the project in the localProjectState array
 * @param event - Drag event
 */
const start = (index: number, event: DragEvent) => {
  currentIndex = index;
  (event.currentTarget as HTMLElement).classList.add("dragstart");

  const ghost = (event.currentTarget as HTMLElement).querySelector("summary");
  if (!ghost) return;

  event.dataTransfer?.setDragImage(ghost, 50, 50);
};

/**
 * Handles drag end event
 * @param event - Drag event
 */
const end = (event: DragEvent) => {
  (event.currentTarget as HTMLElement).classList.remove("dragstart");
};

/**
 * Handles drag over event
 * @param event - Drag event
 */
const over = (event: DragEvent) => {
  event.preventDefault();
  (event.currentTarget as HTMLElement).classList.add("dragover");
};

/**
 * Handles drag leave event
 * @param event - Drag event
 */
const leave = (event: DragEvent) => {
  (event.currentTarget as HTMLElement).classList.remove("dragover");
};

/**
 * Handles drop event
 * @param index - Target index for dropping
 * @param event - Drag event
 */
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
