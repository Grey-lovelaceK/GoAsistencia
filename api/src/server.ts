import "dotenv/config";
import { buildApp } from "./app";
import { env } from "./config/env";

async function main() {
  const app = await buildApp();
  try {
    const address = await app.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`\n  API corriendo en ${address}\n`);
  } catch (err) {
    console.error("Error al iniciar el servidor:", err);
    process.exit(1);
  }
}

main();
