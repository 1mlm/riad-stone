const BROWSER_PATTERNS: [name: string, pattern: RegExp][] = [
  ["Edge", /Edg\//],
  ["Chrome", /Chrome\//],
  ["Firefox", /Firefox\//],
  ["Safari", /Version\/.*Safari\//],
];

const OS_PATTERNS: [name: string, pattern: RegExp][] = [
  ["iPhone", /iPhone/],
  ["iPad", /iPad/],
  ["Android", /Android/],
  ["Windows", /Windows/],
  ["macOS", /Mac OS X/],
  ["Linux", /Linux/],
];

function matchFirst(userAgent: string, patterns: [string, RegExp][]) {
  return patterns.find(([, pattern]) => pattern.test(userAgent))?.[0];
}

export function describeUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const browser = matchFirst(userAgent, BROWSER_PATTERNS) ?? "Navigateur inconnu";
  const os = matchFirst(userAgent, OS_PATTERNS);
  return os ? `${browser} sur ${os}` : browser;
}
