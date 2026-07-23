"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { addToast } = useToast();

  const save = useCallback(
    async (fn: () => Promise<void>) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setState((s) => ({ ...s, status: "saving" }));

      try {
        await fn();
        setState({ status: "saved", lastSaved: new Date() });
        timerRef.current = setTimeout(() => {
          setState((s) => ({
            ...s,
            status: s.status === "saved" ? "idle" : s.status,
          }));
        }, 2000);
      } catch (err) {
        console.error("Autosave failed:", err);
        setState((s) => ({ ...s, status: "error" }));
        addToast("Failed to save changes. Please try again.", "error");
      }
    },
    [addToast]
  );

  const debouncedSave = useCallback(
    (fn: () => Promise<void>, delay = 600) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState((s) => ({ ...s, status: "saving" }));
      timerRef.current = setTimeout(() => save(fn), delay);
    },
    [save]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { saveState: state, save, debouncedSave };
}
