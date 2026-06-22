const path = require('path');
const { readJson } = require('./lib');

const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'matches.json');
const LOG_PATH = path.join(ROOT, 'data', 'last-update-log.json');

const matches = readJson(DATA_PATH, []);
const log = readJson(LOG_PATH, { updated_at: '', provider: 'fifa.com', updates: [] });

if (!Array.isArray(matches)) {
  throw new Error('data/matches.json is not an array');
}

console.log(`Build check passed. Matches: ${matches.length}. Last update: ${log.updated_at || 'n/a'}.`);
