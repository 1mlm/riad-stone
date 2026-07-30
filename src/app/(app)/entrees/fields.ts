import {
  ArrowHorizontalIcon,
  ArrowVerticalIcon,
  Calendar04Icon,
  HashIcon,
  Location01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "@/components/Icon";
import { metersToUnit } from "@/utils/length";
import type { EntreeRow } from "./types";

// the unit longueur/largeur are displayed in everywhere outside the raw
// stored meters value — one place to change it instead of three
export const toDisplayLength = (meters: number) => metersToUnit(meters, "cm");

type BaseField = {
  key: keyof EntreeRow;
  label: string;
  icon: HugeIcon;
  required: boolean;
  // readOnly once the entree exists — only its own reference, an immutable id
  lockedOnEdit?: boolean;
  // consecutive fields sharing a group render side by side instead of stacked
  group?: "dimensions";
};

export type EntreeField =
  | (BaseField & {
      kind: "text";
      placeholder?: string;
      // feeds a <datalist> of past values for this field
      suggestions?: boolean;
    })
  | (BaseField & { kind: "date" })
  | (BaseField & { kind: "unitLength" })
  | (BaseField & { kind: "integer" });

// single source of truth for the Entree add/edit forms — driving both is the
// point: a new field only needs one entry here instead of hand-written JSX
// in two dialogs plus a table column plus a history formatter
export const ENTREE_FIELDS = [
  {
    key: "designation",
    label: "Désignation",
    icon: Tag01Icon,
    required: true,
    kind: "text",
    placeholder: "Granite, Ibiza...",
    suggestions: true,
  },
  {
    key: "reference",
    label: "Référence",
    icon: HashIcon,
    required: true,
    kind: "text",
    placeholder: "TZ20",
    lockedOnEdit: true,
  },
  {
    key: "date",
    label: "Date",
    icon: Calendar04Icon,
    required: true,
    kind: "date",
  },
  {
    key: "longueur",
    label: "Longueur",
    icon: ArrowHorizontalIcon,
    required: true,
    kind: "unitLength",
    group: "dimensions",
  },
  {
    key: "largeur",
    label: "Largeur",
    icon: ArrowVerticalIcon,
    required: true,
    kind: "unitLength",
    group: "dimensions",
  },
  {
    key: "nombrePieces",
    label: "Pièces",
    icon: HashIcon,
    required: true,
    kind: "integer",
  },
  {
    key: "origine",
    label: "Origine",
    icon: Location01Icon,
    required: false,
    kind: "text",
  },
] as const satisfies readonly EntreeField[];

export const ENTREE_FIELD_BY_KEY: Record<EntreeField["key"], EntreeField> =
  Object.fromEntries(
    ENTREE_FIELDS.map((field) => [field.key, field]),
  ) as Record<EntreeField["key"], EntreeField>;
