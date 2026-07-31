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

export const NAV_ITEMS: {
  href: string;
  label: string;
  icon: HugeIcon;
  countKey?: "entrees" | "sorties" | "stock";
}[] = [
  {
    href: "/entrees",
    label: "Entrées",
    icon: ArchiveArrowDownIcon,
    countKey: "entrees",
  },
  {
    href: "/sorties",
    label: "Sorties",
    icon: ArchiveArrowUpIcon,
    countKey: "sorties",
  },
  { href: "/stock", label: "Stock", icon: PackageIcon, countKey: "stock" },
  { href: "/historique", label: "Historique", icon: ScrollIcon },
];
