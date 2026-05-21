import { URL } from "url";

/**
 * Returns a fully qualified URL for the avatar if it's local.
 * Preserves external (e.g. Google auth) avatar URLs.
 * 
 * @param {object} req - Express request object (to extract protocol/host)
 * @param {string} avatarUrl - The raw avatar URL from the database
 * @returns {string} The fully qualified avatar URL
 */
export const getFullAvatarUrl = (req, avatarUrl) => {
  if (!avatarUrl) return avatarUrl;
  if (avatarUrl.startsWith("http")) {
    // If it's a local upload but was saved with a different host/port, update it to the current server host/port
    if (avatarUrl.includes("/uploads/avatars/")) {
      const index = avatarUrl.indexOf("/uploads/avatars/");
      const pathPart = avatarUrl.substring(index);
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      return `${baseUrl}${pathPart}`;
    }
    return avatarUrl;
  }
  
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  // Ensure the relative path has a leading slash
  const pathPart = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
  return `${baseUrl}${pathPart}`;
};

/**
 * Stems the host and port for local uploads, returning a clean relative path
 * (e.g. /uploads/avatars/...) to save in MongoDB. External URLs are saved as-is.
 * 
 * @param {string} avatarUrl - The avatar URL to normalize
 * @returns {string} The normalized relative path or original URL
 */
export const getRelativeAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return avatarUrl;
  if (avatarUrl.startsWith("/")) return avatarUrl;
  
  if (avatarUrl.includes("/uploads/avatars/")) {
    try {
      const url = new URL(avatarUrl);
      return url.pathname;
    } catch {
      // Fallback in case of invalid URL or relative path without leading slash
      const index = avatarUrl.indexOf("/uploads/avatars/");
      if (index !== -1) {
        return avatarUrl.substring(index);
      }
    }
  }
  
  return avatarUrl;
};
