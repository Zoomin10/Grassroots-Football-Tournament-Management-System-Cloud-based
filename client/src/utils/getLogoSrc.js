
function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Keyword-based logo rules
const LOGO_RULES = [
  { keywords: ["wroughton"], file: "wroughtonyouthfc.png" },
  { keywords: ["draycott"], file: "draycottfc.png" },
   { keywords: ["bishops"], file: "bishopscannings.png" },
    { keywords: ["derry"], file: "derryhillfc.png" },
  // add more clubs here
];

export function getLogoSrc(name) {
  if (!name) return "/logos/default.png";

  const text = normalize(name);

  for (const rule of LOGO_RULES) {
    if (rule.keywords.some(keyword => text.includes(keyword))) {
      return `/logos/${rule.file}`;
    }
  }

  return "/logos/default.png";
}
