const path = require('path');
const { readJson, writeJson, nowBeijing } = require('./lib');
const { fetchFifaMatches } = require('./fifa');

const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'matches.json');
const LOG_PATH = path.join(ROOT, 'data', 'last-update-log.json');

function sortRows(rows) {
  return rows.sort((a, b) => (
    a.date_beijing.localeCompare(b.date_beijing)
    || a.kickoff_beijing.localeCompare(b.kickoff_beijing)
    || a.match_id.localeCompare(b.match_id)
  ));
}

function sameMeaningfulRow(a, b) {
  const ignore = new Set(['provider_last_updated', 'last_updated']);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)].filter((key) => !ignore.has(key)));
  for (const key of keys) {
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) return false;
  }
  return true;
}

async function main() {
  const current = readJson(DATA_PATH, []);
  const latest = await fetchFifaMatches();
  const byId = new Map(latest.map((row) => [String(row.match_id), row]));
  const updates = [];
  let changed = false;

  for (const row of current) {
    const next = byId.get(String(row.match_id));
    if (!next || sameMeaningfulRow(row, next)) continue;
    Object.assign(row, next);
    updates.push(`${row.match_id}: refreshed ${row.status}${row.status === 'finished' ? ` ${row.home_score}-${row.away_score}` : ''}`);
    changed = true;
  }

  for (const row of latest) {
    if (current.some((item) => String(item.match_id) === String(row.match_id))) continue;
    current.push(row);
    updates.push(`${row.match_id}: added`);
    changed = true;
  }

  if (changed) {
    writeJson(DATA_PATH, sortRows(current));
    console.log(updates.join('\n'));
  } else {
    updates.push('checked FIFA official API; no data changes');
    console.log('No changes');
  }

  writeJson(LOG_PATH, {
    updated_at: nowBeijing(),
    provider: 'fifa.com',
    updates
  });
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
