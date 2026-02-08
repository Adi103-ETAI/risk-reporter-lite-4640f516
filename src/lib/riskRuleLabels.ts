// Central mapping for analyst-friendly risk rule labels.

const RULE_LABELS: Record<string, string> = {
  phishing_keywords: "Phishing keywords",
  length_over_100: "Excessive URL length",
  raw_ip_host: "Raw IP hostname",
  special_chars_over_4: "High special-character density",
  domain_blacklisted: "Domain blacklisted",
  uses_http: "Insecure protocol (HTTP)",
  https_long_domain_bonus: "HTTPS reputation bonus",
};

function titleCaseFromId(id: string) {
  return id
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function getRiskRuleLabel(ruleId: string) {
  return RULE_LABELS[ruleId] ?? titleCaseFromId(ruleId);
}
