"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";

// forces a fixed wait before an action can run at all — a cheap, deliberate
// friction against reflexive misclicks (destructive confirms) and rapid-fire
// brute forcing (gate unlock), without exposing a countdown to race against
export function DelayedButton({
  waitSeconds = 7,
  disabled,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { waitSeconds?: number }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), waitSeconds * 1000);
    return () => clearTimeout(timeout);
  }, [waitSeconds]);

  return (
    <Button disabled={!ready || disabled} {...props}>
      {ready ? (
        children
      ) : (
        <>
          <Icon icon={Loading03Icon} className="animate-spin" />
          Patientez…
        </>
      )}
    </Button>
  );
}
