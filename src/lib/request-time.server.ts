import "server-only";

import { connection } from "next/server";

/** Current request time (forces dynamic rendering, so it's never stale). */
export async function getRequestTime(): Promise<number> {
  await connection();
  return Date.now();
}
