import { useEffect, useRef, useState } from "react";

// true while a file is being dragged anywhere over the window — drives the
// full-page "déposez ici" overlay. dragenter/dragleave fire on every element
// the pointer crosses (including children), so a plain enter/leave toggle
// flickers; a counter that only flips off at zero is the standard fix.
// onFile is read through a ref rather than as a dependency so the listeners
// attach once on mount instead of churning on every render
export function useWindowFileDrop(onFile: (file: File) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;

  useEffect(() => {
    let depth = 0;
    const isFileDrag = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes("Files");

    const onDragEnter = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      depth++;
      setIsDragging(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
    };
    const onDragLeave = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setIsDragging(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      depth = 0;
      setIsDragging(false);
      const file = event.dataTransfer?.files[0];
      if (file) onFileRef.current(file);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return isDragging;
}
