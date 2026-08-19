import { PackageIcon } from "@hugeicons/core-free-icons";
import type { AppNavBrand, AppNavItem } from "@/components/app-nav/types";
import { ICONS } from "@/utils/icon";

export const APP_HEADER: AppNavBrand = {
  iconSrc: "/icon.svg",
  text: "Riad Stone",
  subtext: "Pour Blal 😋",
};

export const NAV_ITEMS: AppNavItem[] = [
  {
    href: "/entrees",
    label: "Entrées",
    icon: ICONS.entree,
    countKey: "entrees",
  },
  {
    href: "/sorties",
    label: "Sorties",
    icon: ICONS.sortie,
    countKey: "sorties",
  },
  { href: "/stock", label: "Stock", icon: PackageIcon, countKey: "stock" },
  {
    href: "/historique",
    label: "Historique",
    icon: ICONS.history,
    countKey: "historique",
  },
];
