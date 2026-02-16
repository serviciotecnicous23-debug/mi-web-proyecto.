import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const hasDatabase = !!process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production";

// Usar una base de datos en memoria si DATABASE_URL no está disponible
const connectionString = process.env.DATABASE_URL || "postgresql://tempuser:temppass@localhost/tempdb";

export const pool = new Pool({ 
  connectionString,
  // Optimized pool settings for Render Starter plan (always-on)
  connectionTimeoutMillis: hasDatabase ? 10000 : 1000,
  idleTimeoutMillis: isProduction ? 60000 : 30000, // Keep connections longer in production
  max: hasDatabase ? 20 : 1, // More connections for production workload
  // Enable SSL in production (Render requires it)
  ssl: hasDatabase && isProduction ? { rejectUnauthorized: false } : undefined,
});

// Manejar errores de conexión sin fallar al iniciar
pool.on('error', (err) => {
  if (hasDatabase) {
    console.error('Error de pool de base de datos:', err.message);
  }
  // No re-lanzar para evitar crash del proceso
});

export const db = drizzle(pool, { schema });
