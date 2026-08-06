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

// dividing by a power of ten (e.g. meters / 0.01) routinely lands on
// something like 237.99999999999997 instead of 238 — round the float noise
// away here, the one place every display/export path converts through
export const metersToUnit = (meters: number, unit: LengthUnit): number =>
  Math.round((meters / METERS_PER_UNIT[unit]) * 1e6) / 1e6;
