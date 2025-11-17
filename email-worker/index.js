import dotenv from 'dotenv';
import { runOnce } from './lib.js';

dotenv.config();

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '10', 10) * 1000;

console.log('Email worker started. Poll interval:', POLL_INTERVAL / 1000, 's');
const RUN_ONCE = process.argv.includes('--once') || process.env.RUN_ONCE === 'true';

if (RUN_ONCE) {
  (async () => {
    try {
      await runOnce();
      console.log('Run-once complete, exiting.');
      process.exit(0);
    } catch (err) {
      console.error('Run-once error', err);
      process.exit(1);
    }
  })();
} else {
  // Immediately run then interval
  runOnce();
  setInterval(runOnce, POLL_INTERVAL);
}
