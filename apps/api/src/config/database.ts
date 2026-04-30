import pg from "pg";
const { Pool } = pg;
import { env } from "./env.js";
import { logger } from "./logger.js";

/**
 * @description PostgreSQL connection pool for Supabase.
 * 
 * This module sets up a connection pool to the PostgreSQL database used by Supabase.
 * It reads the connection details from validated environment variables.
 * A test query is executed upon connection to verify that the connection is established successfully.
 */
export const pool = new Pool({
  user: env.SUPABASE_USER,
  host: env.SUPABASE_HOST,
  database: env.SUPABASE_DATABASE_NAME,
  password: env.SUPABASE_DATABASE_PASSWORD,
  port: env.SUPABASE_PORT,
  ssl: {
    rejectUnauthorized: env.SUPABASE_SSL_REJECT_UNAUTHORIZED,
  },
});

// Test the connection on initialization
pool.connect((err, client, release) => {
  if (err || !client) {
    logger.error({ err }, "Error acquiring database client");
    return;
  }
  client.query("SELECT NOW()", (err, result) => {
    release();
    if (err) {
      logger.error({ err }, "Error executing test query");
      return;
    }
    logger.info({ now: result.rows[0].now }, "Database connection established successfully");
  });
});

/**
 * Helper function to execute database queries
 */
export const query = (text: string, params?: any[]) => pool.query(text, params);
