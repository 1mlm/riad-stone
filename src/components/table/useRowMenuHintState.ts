import { useEffect, useState } from "react";
import {
  getRowMenuOpenCount,
  recordRowMenuOpen,
  shouldShowRowMenuHint,
} from "@/utils/rowMenuHint";

// starts at 0 (matches SSR, which has no localStorage) and syncs the real
// count after mount — a returning user might see the hint flash briefly
// before disappearing rather than never render it, but avoids a hydration
// mismatch between server and client markup
export function useRowMenuHintState() {
  const [menuOpenCount, setMenuOpenCount] = useState(0);

  useEffect(() => {
    setMenuOpenCount(getRowMenuOpenCount());
  }, []);

  return {
    shouldShow: (hasRowMenu: boolean) =>
      hasRowMenu && shouldShowRowMenuHint(menuOpenCount),
    recordOpen: () => setMenuOpenCount(recordRowMenuOpen()),
  };
}
