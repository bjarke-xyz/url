export const getBaseUrl = (hostHeader: string): string => {
  if (hostHeader?.startsWith("127.0.0.1")) {
    return "http://localhost:8787";
  }
  return `https://${hostHeader}`;
};
