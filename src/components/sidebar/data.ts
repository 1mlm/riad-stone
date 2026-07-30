import {
  ArchiveArrowDownIcon,
  ArchiveArrowUpIcon,
  PackageIcon,
  ScrollIcon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "@/components/Icon";

export const APP_HEADER: { iconSrc: string; text: string; subtext?: string } = {
  iconSrc: "/icon.svg",
  text: "Riad Stone",
  subtext: "Pour Blal 😋",
};

export const NAV_ITEMS: { href: string; label: string; icon: HugeIcon }[] = [
  { href: "/entrees", label: "Entrées", icon: ArchiveArrowDownIcon },
  { href: "/sorties", label: "Sorties", icon: ArchiveArrowUpIcon },
  { href: "/stock", label: "Stock", icon: PackageIcon },
  { href: "/historique", label: "Historique", icon: ScrollIcon },
];
