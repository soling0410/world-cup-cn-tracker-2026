const fs = require('fs');

const TZ = 'Asia/Shanghai';

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function nowBeijing() {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false
  });
  return `${fmt.format(new Date()).replace(' ', ' ')}:00+08:00`;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d).replace(/\//g, '-');
}

function formatTime(date) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
}

function toBeijingFields(utcDate) {
  const start = new Date(utcDate);
  if (Number.isNaN(start.getTime())) return {};
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    provider_utc_date: start.toISOString(),
    date_beijing: formatDate(start),
    kickoff_beijing: formatTime(start),
    estimated_end_beijing: formatTime(end)
  };
}

module.exports = {
  TZ,
  readJson,
  writeJson,
  nowBeijing,
  formatDate,
  formatTime,
  toBeijingFields
};
