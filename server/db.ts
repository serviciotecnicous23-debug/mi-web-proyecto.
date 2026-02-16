import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const hasDatabase = !!process.env.DATABASE_URL;

// Usar una base de datos en memoria si DATABASE_URL no está disponible
const connectionString = process.env.DATABASE_URL || "postgresql://tempuser:temppass@localhost/tempdb";

export const pool = new Pool({ 
  connectionString,
  // Configurar timeout para evitar que bloquee indefinidamente
  connectionTimeoutMillis: hasDatabase ? 5000 : 1000,
  idleTimeoutMillis: 30000,
  max: hasDatabase ? 10 : 1,
});

// Manejar errores de conexión sin fallar al iniciar
pool.on('error', (err) => {
  if (hasDatabase) {
    console.error('Error de pool de base de datos:', err.message);
  }
  // No re-lanzar para evitar crash del proceso
});

export const db = drizzle(pool, { schema });
