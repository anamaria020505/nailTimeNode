// Simple in-memory token blacklist
const tokenBlacklist = new Set<string>();

export const addToBlacklist = (token: string) => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};
