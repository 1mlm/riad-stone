"use client";

import { useEffect, useState } from "react";

// shows something (an explanation, an onboarding hint) the first N times a
// component mounts, then stops — counted per browser via localStorage, not
// per account, since it's purely "have you seen this before", not data
// worth syncing anywhere
export function useShowUntilVisitLimit(key: string, limit: number) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const count = Number(localStorage.getItem(key) ?? "0");
      if (count < limit) {
        setVisible(true);
        localStorage.setItem(key, String(count + 1));
      }
    } catch {
      // private browsing / blocked storage — default to not showing rather
      // than risk it reappearing forever
    }
  }, [key, limit]);

  return visible;
}
