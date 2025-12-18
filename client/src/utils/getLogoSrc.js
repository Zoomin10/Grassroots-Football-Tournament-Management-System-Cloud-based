export const getLogoSrc = (teamName) => {
  if (!teamName || typeof teamName !== "string") {
    return "/logos/default.png";
  }

  const safeName = teamName
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

  return `/logos/${safeName}.png`;
};
