// Lovable Cloud backend function: scan-url
// Input: { url: string }
// Output: { lat, lon, country, ip, score, status }

type ScanStatus = "Safe" | "Suspicious" | "Dangerous";

const PHISHING_KEYWORDS = ["login", "verify", "update", "secure", "account", "free", "bonus", "win"] as const;
const SPECIAL_CHARS = new Set(["?", "&", "%", "=", "@", "-", "_"]);

// Keep this deterministic + simple; update as needed.
const DOMAIN_BLACKLIST = ["example-phish.com", "badactor.net", "malware-test.invalid"] as const;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseUrlLoose(input: string): URL | null {
  const raw = input.trim();
  if (!raw) return null;
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
  const ipv4 = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  if (ipv4.test(h)) return true;
  if (!h.includes(":") || !ipv6.test(h)) return false;
  return (h.match(/:/g) ?? []).length >= 2;
}

function countSpecialChars(value: string) {
  let count = 0;
  for (const ch of value) if (SPECIAL_CHARS.has(ch)) count += 1;
  return count;
}

function classify(score: number): ScanStatus {
  if (score <= 20) return "Safe";
  if (score <= 50) return "Suspicious";
  return "Dangerous";
}

function scoreUrl(urlString: string): { score: number; status: ScanStatus } {
  const normalized = urlString.trim();
  const normalizedLower = normalized.toLowerCase();
  const url = parseUrlLoose(urlString);

  const hostname = url?.hostname?.toLowerCase() ?? "";
  const protocol = url?.protocol?.toLowerCase() ?? ""; // includes ':'

  let score = 0;

  // +30 phishing keywords
  if (PHISHING_KEYWORDS.some((k) => normalizedLower.includes(k))) score += 30;

  // +25 URL length > 100
  if (normalized.length > 100) score += 25;

  // +30 raw IP host
  if (hostname && isRawIp(hostname)) score += 30;

  // +15 special chars count > 4
  if (countSpecialChars(normalized) > 4) score += 15;

  // +25 blacklisted domain
  if (hostname && DOMAIN_BLACKLIST.includes(hostname as any)) score += 25;

  // +20 uses http
  if (protocol === "http:") score += 20;

  // -20 https + domain length > 6
  if (protocol === "https:" && hostname.length > 6) score -= 20;

  const finalScore = clamp(score, 0, 100);
  return { score: finalScore, status: classify(finalScore) };
}

async function resolveIpFromHostname(hostname: string): Promise<string> {
  if (isRawIp(hostname)) return hostname;

  // DNS over HTTPS (Google)
  const url = new URL("https://dns.google/resolve");
  url.searchParams.set("name", hostname);
  url.searchParams.set("type", "A");

  const res = await fetch(url.toString(), {
    headers: { "accept": "application/json" },
  });

  if (!res.ok) throw new Error(`DNS resolve failed (${res.status})`);
  const json = await res.json();

  const answers: Array<{ type: number; data: string }> = Array.isArray(json?.Answer) ? json.Answer : [];
  const aRecords = answers.filter((a) => a.type === 1).map((a) => a.data).filter(Boolean);

  if (aRecords.length === 0) throw new Error("No A record found");
  return aRecords[0];
}

async function geoLookup(ip: string): Promise<{ lat: number; lon: number; country: string }> {
  // No-key IP geo endpoint
  const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
  if (!res.ok) throw new Error(`Geo lookup failed (${res.status})`);
  const json = await res.json();

  if (!json?.success) {
    const msg = typeof json?.message === "string" ? json.message : "Unknown geo lookup error";
    throw new Error(msg);
  }

  const lat = Number(json.latitude);
  const lon = Number(json.longitude);
  const country = typeof json.country === "string" ? json.country : "";

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("Geo lookup returned invalid coordinates");

  return { lat, lon, country: country || "—" };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const urlInput = typeof body?.url === "string" ? body.url.trim() : "";

    if (!urlInput) {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const parsed = parseUrlLoose(urlInput);
    const hostname = parsed?.hostname?.trim() || "";
    if (!hostname) {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const ip = await resolveIpFromHostname(hostname.toLowerCase());
    const geo = await geoLookup(ip);
    const risk = scoreUrl(urlInput);

    const payload = {
      lat: geo.lat,
      lon: geo.lon,
      country: geo.country,
      ip,
      score: risk.score,
      status: risk.status,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Basic CORS for browser calls
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }
});
