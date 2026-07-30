export const LENGTH_UNITS = ["mm", "cm", "dm", "m"] as const;
export type LengthUnit = (typeof LENGTH_UNITS)[number];

const METERS_PER_UNIT: Record<LengthUnit, number> = {
  mm: 0.001,
  cm: 0.01,
  dm: 0.1,
  m: 1,
};

export const lengthToMeters = (value: number, unit: LengthUnit): number =>
  value * METERS_PER_UNIT[unit];

export const metersToUnit = (meters: number, unit: LengthUnit): number =>
  meters / METERS_PER_UNIT[unit];
