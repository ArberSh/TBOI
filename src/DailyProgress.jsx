import { Link } from 'react-router-dom';
import './DailyProgress.css';

function getTodayKey() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

const GAMES = [
  {
    id: 'gti',
    label: 'Guess The Item',
    to: '/guess-the-item',
    icon: '/images/items/collectibles_001_thesadonion.png',
  },
  {
    id: 'bf',
    label: 'Boss Finder',
    to: '/boss-preview-x7k2m9',
    icon: '/images/items/boss-portraits/boss-portraits/monstro.png',
  },
];

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

export default function DailyProgress({ currentPage, gtiOverride, bfOverride }) {
  const todayKey = getTodayKey();
  const gtiState = gtiOverride ?? readGtiState(todayKey);
  const bfState  = bfOverride  ?? readBfState(todayKey);

  const stateMap = { gti: gtiState, bf: bfState };
  const completed = (gtiState.done ? 1 : 0) + (bfState.done ? 1 : 0);

  return (
    <div className="dp-wrap">
      <p className="dp-heading">Daily Progress</p>
      <div className="dp-cards">
        {GAMES.map(game => {
          const { done, won } = stateMap[game.id];
          const isActive = game.id === currentPage;
          const cls = [
            'dp-card',
            isActive && 'dp-card--active',
            done && (won ? 'dp-card--won' : 'dp-card--lost'),
          ].filter(Boolean).join(' ');

          const inner = (
            <>
              <div className="dp-icon-frame">
                <img src={game.icon} alt={game.label} className="dp-icon-img" />
                {done && (
                  <span className={`dp-badge ${won ? 'dp-badge--won' : 'dp-badge--lost'}`}>
                    {won ? '✓' : '✗'}
                  </span>
                )}
              </div>
              <span className="dp-label">{game.label}</span>
            </>
          );

          return isActive
            ? <div key={game.id} className={cls}>{inner}</div>
            : <Link key={game.id} className={cls} to={game.to}>{inner}</Link>;
        })}
      </div>
      <p className="dp-count">{completed} / 2 completed</p>
    </div>
  );
}
