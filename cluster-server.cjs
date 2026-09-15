const cluster = require("node:cluster");
const os = require("node:os");
const { spawn } = require("node:child_process");

const zadanaLiczba = Number(process.env.WEB_CONCURRENCY || 3);
const liczbaProcesow = Number.isInteger(zadanaLiczba)
  ? Math.max(1, Math.min(zadanaLiczba, os.availableParallelism()))
  : 3;

if (cluster.isPrimary) {
  let zamykanie = false;
  let workerEmail = null;

  const uruchomWorkerEmail = () => {
    workerEmail = spawn(process.execPath, ["worker.mjs"], {
      cwd: __dirname,
      env: process.env,
      stdio: "inherit",
    });
    workerEmail.on("exit", (code, signal) => {
      if (!zamykanie) {
        console.error(`[cluster] Worker e-mail zakończył się (${signal || code}). Uruchamiam zastępczy.`);
        setTimeout(uruchomWorkerEmail, 2000).unref();
      }
    });
  };

  uruchomWorkerEmail();
  for (let i = 0; i < liczbaProcesow; i += 1) cluster.fork();

  cluster.on("exit", (worker, code, signal) => {
    if (!zamykanie) {
      console.error(`[cluster] Proces ${worker.process.pid} zakończył się (${signal || code}). Uruchamiam zastępczy.`);
      cluster.fork();
    }
  });

  const zakoncz = (sygnal) => {
    if (zamykanie) return;
    zamykanie = true;
    for (const worker of Object.values(cluster.workers)) worker?.process.kill(sygnal);
    workerEmail?.kill(sygnal);
    setTimeout(() => process.exit(0), 8000).unref();
  };

  process.on("SIGTERM", () => zakoncz("SIGTERM"));
  process.on("SIGINT", () => zakoncz("SIGINT"));
} else {
  require("./server.js");
}
