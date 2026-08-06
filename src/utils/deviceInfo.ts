import { geolocation, ipAddress } from "@vercel/functions";
import { UAParser } from "ua-parser-js";

export type DeviceInfo = {
  userAgent: string | null;
  browser?: { name?: string; version?: string };
  os?: { name?: string; version?: string };
  device?: { type?: string; vendor?: string; model?: string };
  engine?: { name?: string; version?: string };
  cpu?: { architecture?: string };
  ip?: string;
  geo?: {
    city?: string;
    country?: string;
    flag?: string;
    countryRegion?: string;
    region?: string;
    latitude?: string;
    longitude?: string;
    postalCode?: string;
  };
};

// pulls every scrap of client/request info Vercel and the UA string give us
// for free (no external lookups) into one JSON blob — parsing is delegated
// to ua-parser-js rather than hand-rolled regexes, and geo/IP come from
// Vercel's own edge headers (only populated in production, not local dev).
// Unknown fields are omitted entirely (not set to undefined) so the result
// stays valid JSON as-is
export function buildDeviceInfo(requestHeaders: Headers): DeviceInfo {
  // Next's `headers()` return value isn't a plain Headers instance, which
  // trips up @vercel/functions' `"headers" in input` duck-typing check —
  // normalize to a real Headers instance first
  const headers = new Headers(requestHeaders);
  const userAgent = headers.get("user-agent");
  const { browser, os, device, engine, cpu } = UAParser(userAgent ?? "");
  const {
    city,
    country,
    flag,
    countryRegion,
    region,
    latitude,
    longitude,
    postalCode,
  } = geolocation({ headers });
  const geo = {
    city,
    country,
    flag,
    countryRegion,
    region,
    latitude,
    longitude,
    postalCode,
  };
  const hasGeo = Object.values(geo).some((value) => value !== undefined);
  const ip = ipAddress(headers);

  return {
    userAgent,
    ...(browser.name && {
      browser: { name: browser.name, version: browser.version },
    }),
    ...(os.name && { os: { name: os.name, version: os.version } }),
    ...(device.type && {
      device: { type: device.type, vendor: device.vendor, model: device.model },
    }),
    ...(engine.name && {
      engine: { name: engine.name, version: engine.version },
    }),
    ...(cpu.architecture && { cpu: { architecture: cpu.architecture } }),
    ...(ip && { ip }),
    ...(hasGeo && { geo }),
  };
}
