import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Build connection string from DATABASE_URL or individual PG* vars
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;
  if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
    const port = PGPORT || '5432';
    return `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${port}/${PGDATABASE}?sslmode=require`;
  }
  
  throw new Error(
    "Database credentials not found. Expected DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE environment variables.",
  );
}

const connectionString = getDatabaseUrl();
export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });