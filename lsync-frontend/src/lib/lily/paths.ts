/** The pages where Lily appears. Kept in its own tiny file so the loader can decide without downloading Lily herself. */
export const isPublicPath = (p: string) => p === "/" || p.startsWith("/blog") || ["/login", "/register", "/forgot-password", "/reset-password"].includes(p);
