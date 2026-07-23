"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

interface AutosaveState {
  status: "idle" | "saving" | "saved" | "error";
  lastSaved: Date | null;
}

export function useAutosave() {
  const [state, setState] = useState<AutosaveState>({
    status: "idle",
    lastSaved: null,
  });
  const timerRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { addToast } = useToast();

  const saveNow = useCallback(
    async (key: string, fn: () => Promise<void>) => {
      const existing = timerRefs.current.get(key);
      if (existing) clearTimeout(existing);

      setState({ status: "saving", lastSaved: null });

      try {
        await fn();
        timerRefs.current.delete(key);

        if (timerRefs.current.size === 0) {
          setState({ status: "saved", lastSaved: new Date() });
          setTimeout(() => {
            setState((s) =>
              s.status === "saved" ? { status: "idle", lastSaved: null } : s
            );
          }, 2000);
        }
      } catch (err) {
        console.error("Autosave failed for", key, err);
        timerRefs.current.delete(key);
        setState({ status: "error", lastSaved: null });
        addToast("Failed to save changes. Please try again.", "error");
      }
    },
    [addToast]
  );

  const debouncedSave = useCallback(
    (key: string, fn: () => Promise<void>, delay = 600) => {
      const existing = timerRefs.current.get(key);
      if (existing) clearTimeout(existing);

      timerRefs.current.set(
        key,
        setTimeout(() => saveNow(key, fn), delay)
      );
    },
    [saveNow]
  );

  const save = useCallback(
    (key: string, fn: () => Promise<void>) => saveNow(key, fn),
    [saveNow]
  );

  useEffect(() => {
    return () => {
      timerRefs.current.forEach((timer) => clearTimeout(timer));
      timerRefs.current.clear();
    };
  }, []);

  return { saveState: state, save, debouncedSave };
}
