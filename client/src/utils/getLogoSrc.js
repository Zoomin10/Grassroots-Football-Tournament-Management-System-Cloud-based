
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
    { keywords: ["chipp"], file: "chippenhamfc.png" },
    { keywords: ["bluns"], file: "blunsdonfc.png" },
    { keywords: ["malm"], file: "malmesbury.png" },
    { keywords: ["croft"], file: "croftfc.png" },
    { keywords: ["abbey"], file: "abbeymeads.png" },
    { keywords: ["woott"], file: "woottonbassett.png" },
    { keywords: ["develop"], file: "developfc.png" },
    { keywords: ["melks"], file: "melkshamfc.png" },
    { keywords: ["ashton"], file: "ashtonkeynes.png" },
    { keywords: ["bath "], file: "bathcity.png" },
    { keywords: ["strat"], file: "strattonjuniors.png" },
    { keywords: ["spitf"], file: "swindonspitfires.png" },
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
