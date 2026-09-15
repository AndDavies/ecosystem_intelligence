import sharp from "sharp";

/** Preserve the mark; give white lettering a readable surface on light dossiers. */
export async function normalizeOfficialLogo(input: string | Buffer) {
  const bounded = await sharp(input).rotate().resize({ width: 1024, height: 512, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  const { data } = await sharp(bounded).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let ink = 0;
  let whiteInk = 0;
  let transparent = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    ink += alpha;
    transparent += 1 - alpha;
    if (Math.min(data[i], data[i + 1], data[i + 2]) > 210) whiteInk += alpha;
  }
  const darkBackground = transparent > data.length / 4 * 0.1 && ink > 0 && whiteInk / ink > 0.55;
  const image = sharp(bounded);
  if (darkBackground) image.flatten({ background: "#172431" });
  return { bytes: await image.webp({ quality: 92, alphaQuality: 100 }).toBuffer(), darkBackground };
}
