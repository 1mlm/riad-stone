import {
  Download01Icon,
  PackageIcon,
  ScrollIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import type { AppNavBrand, AppNavItem } from "@/components/app-nav/types";

export const APP_HEADER: AppNavBrand = {
  iconSrc: "/icon.svg",
  text: "Riad Stone",
  subtext: "Pour Blal 😋",
};

export const NAV_ITEMS: AppNavItem[] = [
  {
    href: "/entrees",
    label: "Entrées",
    icon: Download01Icon,
    countKey: "entrees",
  },
  {
    href: "/sorties",
    label: "Sorties",
    icon: Upload01Icon,
    countKey: "sorties",
  },
  { href: "/stock", label: "Stock", icon: PackageIcon, countKey: "stock" },
  { href: "/historique", label: "Historique", icon: ScrollIcon },
];
