import { runAutonomousCycle, runFastAutonomousSweep } from './autonomous-worker';

let daemonInterval: NodeJS.Timeout | null = null;
let isStarted = false;

// 10-second scraping pipeline interval
const INTERVAL_MS = 10 * 1000;

export function startAutonomousDaemon() {
  if (isStarted) return;
  isStarted = true;

  console.log('[AutonomousDaemon] Initializing 24/7 high-speed background intelligence daemon (10s interval)...');

  // Run initial cycle after 5 seconds of server bootup
  setTimeout(() => {
    runAutonomousCycle().catch((err) => {
      console.error('[AutonomousDaemon] Initial cycle error:', err);
    });
  }, 5000);

  daemonInterval = setInterval(() => {
    runFastAutonomousSweep().catch((err) => {
      console.error('[AutonomousDaemon] 10s autonomous sweep error:', err);
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

export function isDaemonActive(): boolean {
  return isStarted;
}
