// Helpers to serve right-sized, modern-format Cloudinary images.
// Non-Cloudinary URLs are returned unchanged (safe no-op).

export const isCloudinary = (url) =>
  typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/upload/');

/**
 * Inject Cloudinary transformations into the URL.
 * e.g. cloudinaryUrl(u, { w: 800 }) -> .../upload/f_auto,q_auto,w_800/<name>
 */
export const cloudinaryUrl = (url, { w, h, crop = 'fill', quality = 'auto', format = 'auto' } = {}) => {
  if (!isCloudinary(url)) return url;
  const t = [];
  if (format) t.push(`f_${format}`);
  if (quality) t.push(`q_${quality}`);
  if (w) t.push(`w_${w}`);
  if (h) t.push(`h_${h}`);
  if (w || h) t.push(`c_${crop}`);
  return url.replace('/upload/', `/upload/${t.join(',')}/`);
};

/** Build a srcSet for Cloudinary images (undefined otherwise). */
export const cloudinarySrcSet = (url, widths = [400, 800, 1200]) => {
  if (!isCloudinary(url)) return undefined;
  return widths.map((w) => `${cloudinaryUrl(url, { w })} ${w}w`).join(', ');
};

export default cloudinaryUrl;
