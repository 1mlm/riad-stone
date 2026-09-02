"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { copyToClipboard } from "@/utils/clipboard";
import { haptic } from "@/utils/haptics";
import { ICONS } from "@/utils/icon";

// this file sits outside the (app) route group, so when (app)/layout.tsx
// itself throws (e.g. the sidebar's count queries hit a dead DB) Next skips
// straight to this boundary instead of one nested inside the failed layout —
// which means the sidebar never renders around the error, with no manual
// redirect needed
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleCopyDetails = () => {
    const report = [
      "Riad Stone — rapport d'erreur",
      `Date : ${new Date().toISOString()}`,
      `Page : ${window.location.href}`,
      `Message : ${error.message}`,
      error.digest && `Référence (digest) : ${error.digest}`,
      `Navigateur : ${navigator.userAgent}`,
    ]
      .filter(Boolean)
      .join("\n");

    copyToClipboard(report);
    setCopied(true);
    haptic("light");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="relative">
        <div className="flex size-16 items-center justify-center rounded-2xl corner-squircle bg-muted p-3">
          <Image
            src="/icon.svg"
            alt=""
            width={40}
            height={40}
            className="size-full"
          />
        </div>
        <div className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground ring-2 ring-background">
          <Icon icon={ICONS.alert} className="size-3.5" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Oulaaaaaaah</h1>
        <p className="text-muted-foreground">
          Une erreur inattendue s&apos;est produite, dommage 😓
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button className="rounded-full corner-squircle" onClick={reset}>
          <Icon icon={ICONS.retry} />
          Réessayer
        </Button>
        <Button
          variant="outline"
          className="rounded-full corner-squircle"
          onClick={() => window.history.back()}
        >
          <Icon icon={ICONS.back} />
          Retour
        </Button>
        <Button
          variant="ghost"
          className="rounded-full corner-squircle"
          onClick={handleCopyDetails}
        >
          <Icon icon={copied ? ICONS.check : ICONS.copy} />
          {copied ? "Copié" : "Copier les détails"}
        </Button>
      </div>
    </div>
  );
}
