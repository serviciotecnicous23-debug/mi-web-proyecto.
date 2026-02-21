import { memoryStorage } from "./memory-storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function initializeAdmin() {
  const adminEmail = "serviciotecnico.us23@gmail.com";
  const adminPassword = "l27182454";

  try {
    // Verificar si el admin ya existe
    const existing = await memoryStorage.findUserByEmail(adminEmail);
    if (existing) {
      console.log("✓ Usuario administrador ya existe");
      return;
    }

    // Crear el usuario admin
    const hashedPassword = await hashPassword(adminPassword);
    const admin = await memoryStorage.createUser({
      username: "servicio-tecnico",
      password: hashedPassword,
      email: adminEmail,
      role: "admin",
      displayName: "Servicio Técnico",
      isActive: true,
    });

    console.log("✓ Usuario administrador creado exitosamente");
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Usuario: ${admin.username}`);
    console.log(`  Rol: ${admin.role}`);
  } catch (err) {
    console.error("✗ Error al crear usuario administrador:", err);
  }
}

export { initializeAdmin };
