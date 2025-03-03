import { LibsqlConnectionInfo } from "./models/url";

export const getBaseUrl = (hostHeader: string): string => {
  if (hostHeader?.startsWith("127.0.0.1")) {
    return "http://localhost:8787";
  }
  return `https://${hostHeader}`;
};

export const getLibsqlConnInfo = (): LibsqlConnectionInfo => {
  return {
    url: process.env.LIBSQL_URL!,
    authToken: process.env.LIBSQL_AUTH_TOKEN!,
  };
};
