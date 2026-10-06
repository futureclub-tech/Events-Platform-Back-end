import { app } from "./app.js";

const port = Number(process.env["PORT"] ?? 3000);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  process.exitCode = 1;
});
