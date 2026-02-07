export type UrlRiskClassification = "Safe" | "Suspicious" | "Dangerous";

export type UrlRiskRuleId =
  | "phishing_keywords"
  | "length_over_100"
  | "raw_ip_host"
  | "special_chars_over_4"
  | "domain_blacklisted"
  | "uses_http"
  | "https_long_domain_bonus";

export type UrlRiskRuleBreakdownItem = {
  rule: UrlRiskRuleId;
  points: number;
  detail: string;
};

export type UrlRiskResult = {
  score: number; // 0..100
  classification: UrlRiskClassification;
  triggeredRules: UrlRiskRuleId[];
  breakdown: UrlRiskRuleBreakdownItem[];
};

const PHISHING_KEYWORDS = ["login", "verify", "update", "secure", "account", "free", "bonus", "win"] as const;

const SPECIAL_CHARS = new Set(["?", "&", "%", "=", "@", "-", "_"]);

// Keep this simple + editable; caller can pass their own list.
export const DEFAULT_DOMAIN_BLACKLIST = [
  "example-phish.com",
  "badactor.net",
  "malware-test.invalid",
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseUrlLoose(input: string): URL | null {
  const raw = input.trim();
  if (!raw) return null;

  // If user enters a bare domain, URL() throws unless we add a scheme.
  try {
    return new URL(raw);
  } catch {
    try {
      return new URL(`https://${raw}`);
    } catch {
      return null;
    }
  }
}

function isRawIp(hostname: string) {
  const h = hostname.trim();
  // IPv4
  const ipv4 = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  // Basic IPv6 (covers common forms including ::)
  const ipv6 = /^[0-9a-fA-F:]+$/;

  if (ipv4.test(h)) return true;
  if (!h.includes(":") || !ipv6.test(h)) return false;

  // Heuristic: must have at least two ':' to be IPv6-like.
  const colonCount = (h.match(/:/g) ?? []).length;
  return colonCount >= 2;
}

function countSpecialChars(value: string) {
  let count = 0;
  for (const ch of value) if (SPECIAL_CHARS.has(ch)) count += 1;
  return count;
}

function classify(score: number): UrlRiskClassification {
  if (score <= 20) return "Safe";
  if (score <= 50) return "Suspicious";
  return "Dangerous";
}

export function scoreUrlRisk(
  urlString: string,
  options?: {
    domainBlacklist?: readonly string[];
  }
): UrlRiskResult {
  const breakdown: UrlRiskRuleBreakdownItem[] = [];
  const triggeredRules: UrlRiskRuleId[] = [];

  const blacklist = (options?.domainBlacklist ?? DEFAULT_DOMAIN_BLACKLIST).map((d) => d.trim().toLowerCase());
  const url = parseUrlLoose(urlString);

  // If we can't parse it, treat it as suspicious input but keep deterministic.
  // (No explicit rule requested; we just score on the raw string rules below.)
  const normalized = urlString.trim();
  const normalizedLower = normalized.toLowerCase();

  let score = 0;

  // +30 phishing keywords (any match)
  const matchedKeywords = PHISHING_KEYWORDS.filter((k) => normalizedLower.includes(k));
  if (matchedKeywords.length > 0) {
    score += 30;
    triggeredRules.push("phishing_keywords");
    breakdown.push({
      rule: "phishing_keywords",
      points: 30,
      detail: `Matched keywords: ${matchedKeywords.join(", ")}`,
    });
  }

  // +25 URL length > 100
  if (normalized.length > 100) {
    score += 25;
    triggeredRules.push("length_over_100");
    breakdown.push({
      rule: "length_over_100",
      points: 25,
      detail: `Length: ${normalized.length}`,
    });
  }

  const hostname = url?.hostname?.toLowerCase() ?? "";
  const protocol = url?.protocol?.toLowerCase() ?? ""; // includes trailing ':'
  const isHttps = protocol === "https:";
  const isHttp = protocol === "http:";

  // +30 raw IP host
  if (hostname && isRawIp(hostname)) {
    score += 30;
    triggeredRules.push("raw_ip_host");
    breakdown.push({
      rule: "raw_ip_host",
      points: 30,
      detail: `Hostname is an IP: ${hostname}`,
    });
  }

  // +15 special characters count > 4 (in the whole URL string)
  const specialCount = countSpecialChars(normalized);
  if (specialCount > 4) {
    score += 15;
    triggeredRules.push("special_chars_over_4");
    breakdown.push({
      rule: "special_chars_over_4",
      points: 15,
      detail: `Special characters count: ${specialCount}`,
    });
  }

  // +25 domain in blacklist
  if (hostname && blacklist.includes(hostname)) {
    score += 25;
    triggeredRules.push("domain_blacklisted");
    breakdown.push({
      rule: "domain_blacklisted",
      points: 25,
      detail: `Blacklisted domain: ${hostname}`,
    });
  }

  // +20 uses http instead of https
  if (isHttp) {
    score += 20;
    triggeredRules.push("uses_http");
    breakdown.push({
      rule: "uses_http",
      points: 20,
      detail: "URL uses http",
    });
  }

  // −20 if HTTPS is used and domain length > 6
  // (Domain length interpreted as hostname length.)
  if (isHttps && hostname.length > 6) {
    score -= 20;
    triggeredRules.push("https_long_domain_bonus");
    breakdown.push({
      rule: "https_long_domain_bonus",
      points: -20,
      detail: `HTTPS + hostname length ${hostname.length}`,
    });
  }

  const finalScore = clamp(score, 0, 100);

  return {
    score: finalScore,
    classification: classify(finalScore),
    triggeredRules,
    breakdown,
  };
}
