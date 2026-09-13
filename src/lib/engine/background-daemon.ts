import { runAutonomousCycle } from './autonomous-worker';

let daemonInterval: NodeJS.Timeout | null = null;
let isStarted = false;

const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export function startAutonomousDaemon() {
  if (isStarted) return;
  isStarted = true;

  console.log('[AutonomousDaemon] Initializing 24/7 background intelligence daemon...');

  // Run initial cycle after 15 seconds of server bootup to allow full hydration
  setTimeout(() => {
    runAutonomousCycle().catch(err => {
      console.error('[AutonomousDaemon] Initial cycle error:', err);
    });
  }, 15000);

  daemonInterval = setInterval(() => {
    console.log('[AutonomousDaemon] Triggering scheduled 15-minute autonomous discovery sweep...');
    runAutonomousCycle().catch(err => {
      console.error('[AutonomousDaemon] Scheduled cycle error:', err);
    });
  }, INTERVAL_MS);
}

export function stopAutonomousDaemon() {
  if (daemonInterval) {
    clearInterval(daemonInterval);
    daemonInterval = null;
  }
  isStarted = false;
}
