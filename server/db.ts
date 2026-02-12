import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Usar una base de datos en memoria si DATABASE_URL no está disponible
const connectionString = process.env.DATABASE_URL || "postgresql://tempuser:temppass@localhost/tempdb";

export const pool = new Pool({ 
  connectionString,
  // Configurar timeout para evitar que bloquee indefinidamente
  connectionTimeoutMillis: 2000,
  idleTimeoutMillis: 30000,
});

// Manejar errores de conexión sin fallar al iniciar
pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

export const db = drizzle(pool, { schema });
