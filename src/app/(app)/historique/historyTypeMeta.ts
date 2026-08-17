import {
  Delete02Icon,
  EditIcon,
  Key01Icon,
  LogoutIcon,
  NuclearPowerIcon,
  Plant01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import type { CustomTableEnumValue } from "@/components/table/CustomTable";
import { HistoryItemType } from "@/generated/prisma/enums";

export const TYPE_META: Record<HistoryItemType, CustomTableEnumValue> = {
  [HistoryItemType.CREATE_INPUT]: {
    icon: PlusSignIcon,
    color: "green",
    label: "Entrée ajoutée",
  },
  [HistoryItemType.UPDATE_INPUT]: {
    icon: EditIcon,
    color: "amber",
    label: "Entrée modifiée",
  },
  [HistoryItemType.DELETE_INPUT]: {
    icon: Delete02Icon,
    color: "red",
    label: "Entrée supprimée",
  },
  [HistoryItemType.CREATE_OUTPUT]: {
    icon: PlusSignIcon,
    color: "green",
    label: "Sortie ajoutée",
  },
  [HistoryItemType.UPDATE_OUTPUT]: {
    icon: EditIcon,
    color: "amber",
    label: "Sortie modifiée",
  },
  [HistoryItemType.DELETE_OUTPUT]: {
    icon: Delete02Icon,
    color: "red",
    label: "Sortie supprimée",
  },
  [HistoryItemType.CLEAR_EVERYTHING]: {
    icon: NuclearPowerIcon,
    color: "red",
    label: "Toutes les données effacées",
  },
  [HistoryItemType.SEED_FAKE_DATA]: {
    icon: Plant01Icon,
    color: "green",
    label: "Données fictives ajoutées",
  },
  [HistoryItemType.LOGIN]: {
    icon: Key01Icon,
    color: "gray",
    label: "Connexion",
  },
  [HistoryItemType.LOGOUT]: {
    icon: LogoutIcon,
    color: "gray",
    label: "Déconnexion",
  },
};
