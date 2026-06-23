const fs = require('fs');
const path = require('path');
const { nowBeijing, toBeijingFields } = require('./lib');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');
const FIFA_API_BASE = process.env.FIFA_API_BASE || 'https://api.fifa.com/api/v3';
const FIFA_SEASON_ID = process.env.FIFA_SEASON_ID || '285023';
const SOURCE_LABEL = 'FIFA official';
const SOURCE_URL = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures';

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function teamName(team) {
  return team?.TeamName?.find((item) => item.Locale === 'en-GB')?.Description
    || team?.ShortClubName
    || team?.Abbreviation
    || '';
}

const CN = {
  Mexico: '墨西哥',
  'South Africa': '南非',
  'Korea Republic': '韩国',
  Czechia: '捷克',
  Canada: '加拿大',
  'Bosnia and Herzegovina': '波黑',
  'United States': '美国',
  USA: '美国',
  Paraguay: '巴拉圭',
  Qatar: '卡塔尔',
  Switzerland: '瑞士',
  Brazil: '巴西',
  Morocco: '摩洛哥',
  Haiti: '海地',
  Scotland: '苏格兰',
  Australia: '澳大利亚',
  'Türkiye': '土耳其',
  Germany: '德国',
  'Curaçao': '库拉索',
  Netherlands: '荷兰',
  Japan: '日本',
  'Côte d\'Ivoire': '科特迪瓦',
  Ecuador: '厄瓜多尔',
  Sweden: '瑞典',
  Tunisia: '突尼斯',
  Spain: '西班牙',
  'Cabo Verde': '佛得角',
  Belgium: '比利时',
  Egypt: '埃及',
  'Saudi Arabia': '沙特阿拉伯',
  Uruguay: '乌拉圭',
  'IR Iran': '伊朗',
  Iran: '伊朗',
  'New Zealand': '新西兰',
  France: '法国',
  Senegal: '塞内加尔',
  Iraq: '伊拉克',
  Norway: '挪威',
  Argentina: '阿根廷',
  Algeria: '阿尔及利亚',
  Austria: '奥地利',
  Jordan: '约旦',
  Portugal: '葡萄牙',
  'Congo DR': '刚果民主共和国',
  Colombia: '哥伦比亚',
  Uzbekistan: '乌兹别克斯坦',
  Ghana: '加纳',
  Panama: '巴拿马',
  Croatia: '克罗地亚'
};

function stageMap(name) {
  return {
    'First Stage': 'group',
    'Round of 32': 'round_of_32',
    'Round of 16': 'round_of_16',
    'Quarter-final': 'quarterfinal',
    'Semi-final': 'semifinal',
    'Play-off for third place': 'third_place',
    Final: 'final'
  }[name] || 'group';
}

function groupCode(match) {
  const label = match.GroupName?.find((item) => item.Locale === 'en-GB')?.Description
    || match.GroupName?.[0]?.Description
    || '';
  const fromName = label.match(/Group\s+([A-Z])/i)?.[1];
  if (fromName) return fromName.toUpperCase();
  return String(match.PlaceHolderA || '').replace(/[^A-Z]/g, '').slice(0, 1);
}

function statusOf(match) {
  const hasScore = Number.isFinite(match.HomeTeamScore) && Number.isFinite(match.AwayTeamScore);
  const hasOfficialResult = Number(match.ResultType) === 1 && Number(match.OfficialityStatus) === 1;
  if (hasOfficialResult) return 'finished';
  const kickoff = Date.parse(match.Date);
  const hasStarted = Number.isFinite(kickoff) && kickoff <= Date.now();
  if (!hasStarted) return 'upcoming';
  if (hasScore || match.MatchStatus === 0 || String(match.MatchTime || '').includes("'")) return 'live';
  return 'upcoming';
}

function mapMatch(match) {
  const stage = match.StageName?.[0]?.Description || '';
  const home = teamName(match.Home);
  const away = teamName(match.Away);
  const status = statusOf(match);
  return {
    match_id: String(match.IdMatch),
    fifa_match_id: String(match.IdMatch),
    football_data_match_id: null,
    ...toBeijingFields(match.Date),
    official_match_date: '',
    stage: stageMap(stage),
    group: stage === 'First Stage' ? groupCode(match) : '',
    home_team_cn: CN[home] || home,
    home_team_en: home,
    away_team_cn: CN[away] || away,
    away_team_en: away,
    status,
    home_score: Number.isFinite(match.HomeTeamScore) ? match.HomeTeamScore : null,
    away_score: Number.isFinite(match.AwayTeamScore) ? match.AwayTeamScore : null,
    source_label: SOURCE_LABEL,
    source_url: SOURCE_URL,
    review_status: status === 'finished' ? 'confirmed' : 'pending',
    provider: 'fifa.com',
    provider_match_id: String(match.IdMatch),
    provider_last_updated: nowBeijing(),
    last_updated: nowBeijing(),
    placeholder_a: match.PlaceHolderA || '',
    placeholder_b: match.PlaceHolderB || '',
    winner: match.Winner || ''
  };
}

async function fetchFifaMatches() {
  loadEnv();
  const url = `${FIFA_API_BASE}/calendar/matches?language=en&count=500&idSeason=${FIFA_SEASON_ID}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://www.fifa.com/'
    }
  });
  if (!res.ok) {
    throw new Error(`FIFA request failed ${res.status}`);
  }
  const payload = await res.json();
  return (payload.Results || []).filter((item) => item.Date).map(mapMatch);
}

module.exports = {
  fetchFifaMatches,
  SOURCE_LABEL,
  SOURCE_URL
};
