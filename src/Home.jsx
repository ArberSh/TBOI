import { Link } from 'react-router-dom';
import './Home.css';

function getTodayKey() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

function readGtiState(todayKey) {
  try {
    const s = JSON.parse(localStorage.getItem(`tboiGameState_${todayKey}`) || '{}');
    if (s.date !== todayKey) return { done: false, won: false };
    const won = s.hasGuessedCorrectly === true;
    const lost = !won && s.stepIndex >= 6;
    return { done: won || lost, won };
  } catch { return { done: false, won: false }; }
}

function readBfState(todayKey) {
  try {
    const s = JSON.parse(localStorage.getItem(`bossFinderState_${todayKey}`) || '{}');
    if (s.date !== todayKey) return { done: false, won: false };
    const won = s.won === true;
    const lost = !won && (s.wrongGuesses?.length ?? 0) >= 6;
    return { done: won || lost, won };
  } catch { return { done: false, won: false }; }
}

const GAMES = [
  {
    id: 'gti',
    to: '/guess-the-item',
    icon: '/images/items/collectibles_001_thesadonion.png',
    name: 'Guess The Item',
    desc: 'Identify the daily Isaac item from its pixelated silhouette',
  },
  {
    id: 'bf',
    to: '/boss-finder',
    icon: '/images/items/boss-portraits/boss-portraits/monstro.png',
    name: 'Boss Finder',
    desc: 'Figure out the daily Isaac boss from a series of hints',
  },
];

export default function Home() {
  const todayKey = getTodayKey();
  const gtiState = readGtiState(todayKey);
  const bfState = readBfState(todayKey);
  const stateMap = { gti: gtiState, bf: bfState };
  const completed = (gtiState.done ? 1 : 0) + (bfState.done ? 1 : 0);

  return (
    <div className="home-page">
      <div className="home-content">
        <img className="home-logo" src="/logo.png" alt="Isaac Arcade" />
        <p className="home-subtitle">Daily Isaac Challenges</p>

        <div className="home-games">
          {GAMES.map(game => {
            const { done, won } = stateMap[game.id];
            const cardCls = [
              'home-card',
              done && (won ? 'home-card--won' : 'home-card--lost'),
            ].filter(Boolean).join(' ');
            return (
              <Link key={game.id} className={cardCls} to={game.to}>
                <div className="home-card-icon">
                  <img src={game.icon} alt={game.name} className="home-card-img" />
                  {done && (
                    <span className={`home-badge ${won ? 'home-badge--won' : 'home-badge--lost'}`}>
                      {won ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                <div className="home-card-info">
                  <span className="home-card-name">{game.name}</span>
                  <span className="home-card-desc">{game.desc}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="home-count">{completed} / 2 completed today</p>
      </div>

      <div className="home-kofi">
        <a href="https://ko-fi.com/E1E81M8I3S" target="_blank" rel="noopener noreferrer">
          <img
            className="home-kofi-img"
            src="https://storage.ko-fi.com/cdn/kofi5.png?v=6"
            border="0"
            alt="Buy Me a Coffee at ko-fi.com"
          />
        </a>
      </div>
    </div>
  );
}
