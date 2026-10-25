import { buildApp } from "./app.js";
import { config } from "./config/index.js";

const start = async () => {
  const app = await buildApp();
  await app.listen({ host: config.host, port: config.port });
  console.log(`API running at http://${config.host}:${config.port}`);
};

void start();
