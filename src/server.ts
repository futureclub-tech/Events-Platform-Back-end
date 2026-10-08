import { app } from "./app.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.config.js";

const port = Number(process.env["PORT"] ?? 3000);

async function startServer(): Promise<void> {
  await connectDatabase();

  const server = app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });

  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`${signal} received. Shutting down.`);

    server.close((error) => {
      if (error) {
        console.error("Failed to close HTTP server", error);
        process.exitCode = 1;
        return;
      }

      void disconnectDatabase().catch((error: unknown) => {
        console.error("Failed to disconnect from MongoDB", error);
        process.exitCode = 1;
      });
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

void startServer().catch((error: unknown) => {
  console.error("Failed to start API", error);
  process.exitCode = 1;
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection", error);
  process.exitCode = 1;
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  process.exitCode = 1;
});
