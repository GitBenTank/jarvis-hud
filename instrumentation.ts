/**
 * Next.js instrumentation — runs when the Node.js server starts.
 * Starts the Reconciliation Controller when JARVIS_CONTROLLER_ENABLED=1 or in development.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startControllerLoop } = await import(
    "./src/lib/controller"
  );
  startControllerLoop();
}
