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

async function main() {
  const rows = sortRows(await fetchFifaMatches());
  writeJson(DATA_PATH, rows);
  writeJson(LOG_PATH, {
    updated_at: nowBeijing(),
    provider: 'fifa.com',
    updates: [`synced ${rows.length} matches from FIFA official API`]
  });
  console.log(`Synced ${rows.length} FIFA matches into data/matches.json.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
