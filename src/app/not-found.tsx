import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { ICONS } from "@/utils/icon";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <Icon icon={ICONS.notFound} className="size-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Tu va où blal??????</h1>
      <p className="text-sm text-muted-foreground">
        Cette page n&apos;existe pas.
      </p>
      <Button asChild className="rounded-full corner-squircle">
        <Link href="/">
          <Icon icon={ICONS.home} />
          Retour à l&apos;accueil
        </Link>
      </Button>
    </div>
  );
}
