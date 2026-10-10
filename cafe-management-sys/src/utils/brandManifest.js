// Builds the web app manifest for runtime white-labelling.
// Uses ABSOLUTE urls: a blob: manifest has an opaque origin, so relative
// start_url / icon src are ignored by the browser (Chrome logs
// "property 'start_url' ignored, URL is invalid").
export const buildManifest = (brand = {}, origin = '') => {
  const name = brand.title || 'Restaurant';
  const base = String(origin || '').replace(/\/$/, '');
  const icon = (size) => ({
    src: `${base}/logo${size}.png`,
    type: 'image/png',
    sizes: `${size}x${size}`,
  });
  return {
    name,
    short_name: name.slice(0, 12),
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    theme_color: brand.primaryColor || '#ff6b35',
    background_color: '#ffffff',
    icons: [icon(192), icon(512)],
  };
};

export default buildManifest;
