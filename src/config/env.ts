/**
 * @file env.ts
 * @description Typed access to the system database secret contract.
 */

export interface AppEnv {
  SYSTEM_DATABASE_URL_1?: string;
  SYSTEM_DATABASE_URL_2?: string;
  SYSTEM_DATABASE_URL_3?: string;
}

export function getAppEnv(): AppEnv {
  if (typeof process === 'undefined' || !process.env) return {};
  return {
    SYSTEM_DATABASE_URL_1: process.env.SYSTEM_DATABASE_URL_1,
    SYSTEM_DATABASE_URL_2: process.env.SYSTEM_DATABASE_URL_2,
    SYSTEM_DATABASE_URL_3: process.env.SYSTEM_DATABASE_URL_3,
  };
}

export { resolveSystemDatabaseUrl } from '@ultrst-armada/kloks/backend';
