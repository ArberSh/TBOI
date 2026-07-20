import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HINT_ICONS } from './BossHintIcons';
import ALL_BOSSES from './bosses.json';
import firegif from './assets/fire.webp';
import fireimg from './assets/fireimg.png';
import './BossFinder.css';

const CONFETTI_COLORS = [
  '#f0b840', '#5ddb6a', '#e05c5c', '#60c8f0', '#c86af0',
  '#f07840', '#f0e040', '#40f0c8', '#f040a0',
];

function createParticles(W, H) {
  return Array.from({ length: 120 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H * 0.4 - H * 0.1,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 2,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.3,
    w: Math.random() * 10 + 5,
    h: Math.random() * 5 + 3,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    alpha: 1,
  }));
}

const BOSS_POOL = ALL_BOSSES.filter(b => !b.needs_review);
const MAX_GUESSES = 6;

function getTodayKey() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

function getDayIndex(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(2024, 0, 1)) / 86_400_000);
}

function shiftDate(dateKey, delta) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + delta));
  const pad = n => String(n).padStart(2, '0');
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

function getTimeUntilMidnightUTC() {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const diff = midnight - now;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function loadState(dateKey) {
  try {
    const s = JSON.parse(localStorage.getItem(`bossFinderState_${dateKey}`) || '{}');
    if (s.date === dateKey) return s;
  } catch {
    return null;
  }
  return null;
}

function saveState(dateKey, partial) {
  localStorage.setItem(`bossFinderState_${dateKey}`, JSON.stringify({ ...partial, date: dateKey }));
}

function loadStreak() {
  try {
    return JSON.parse(localStorage.getItem('bossFinderStreak') || '{}');
  } catch { return {}; }
}

export default function BossFinder() {
  const todayKey = getTodayKey();
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  const boss = BOSS_POOL[getDayIndex(selectedDateKey) % BOSS_POOL.length];
  const isToday = selectedDateKey === todayKey;
  const earliestKey = useMemo(() => shiftDate(todayKey, -15), [todayKey]);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const prev = document.title;
    document.title = 'Boss Finder';
    return () => { document.head.removeChild(meta); document.title = prev; };
  }, []);

  const init = loadState(todayKey);
  const [wrongGuesses, setWrongGuesses] = useState(init?.wrongGuesses ?? []);
  const [won, setWon]                   = useState(init?.won ?? false);
  const [input, setInput]               = useState('');
  const [hlIndex, setHlIndex]           = useState(-1);
  const [shake, setShake]               = useState(false);
  const [copied, setCopied]             = useState(false);
  const [countdown, setCountdown]       = useState(getTimeUntilMidnightUTC);
  const [showConfetti, setShowConfetti] = useState(false);

  const [streak, setStreak] = useState(() => {
    const stored = loadStreak();
    const { lastPlayedDate, streak: saved = 0 } = stored;
    if (!lastPlayedDate) return 0;
    const yesterday = shiftDate(todayKey, -1);
    if (lastPlayedDate === todayKey || lastPlayedDate === yesterday) return saved;
    return 0;
  });

  const inputRef = useRef(null);
  const confettiRef = useRef(null);
  const rafRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const s = loadState(selectedDateKey);
    setWrongGuesses(s?.wrongGuesses ?? []);
    setWon(s?.won ?? false);
    setInput(''); setHlIndex(-1);
    setShowConfetti(false);
  }, [selectedDateKey]);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getTimeUntilMidnightUTC()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hintsRevealed = Math.min(wrongGuesses.length + 1, boss.hints.length);
  const lost    = !won && wrongGuesses.length >= MAX_GUESSES;
  const gameOver = won || lost;

  useEffect(() => {
    saveState(selectedDateKey, { wrongGuesses, won });
  }, [wrongGuesses, won, selectedDateKey]);

  useEffect(() => {
    if (!gameOver || !isToday) return;
    const stored = loadStreak();
    if (stored.lastPlayedDate === todayKey) return;
    const yesterday = shiftDate(todayKey, -1);
    const base = stored.lastPlayedDate === yesterday ? (stored.streak ?? 0) : 0;
    const newStreak = won ? base + 1 : 0;
    localStorage.setItem('bossFinderStreak', JSON.stringify({ lastPlayedDate: todayKey, streak: newStreak }));
    setStreak(newStreak);
  }, [gameOver, isToday, won, todayKey]);

  useEffect(() => {
    if (!gameOver) return;
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, [gameOver]);

  useEffect(() => {
    if (!showConfetti) return;
    const canvas = confettiRef.current;
    if (!canvas) return;
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    let particles = createParticles(W, H);
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
        p.vy += 0.12; p.alpha -= 0.007;
        if (p.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      particles = particles.filter(p => p.alpha > 0);
      if (particles.length > 0) rafRef.current = requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, W, H);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [showConfetti]);

  const guessedSet = useMemo(
    () => new Set(wrongGuesses.map(g => g.toLowerCase())),
    [wrongGuesses]
  );

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return [];
    return ALL_BOSSES
      .filter(b => {
        if (guessedSet.has(b.name.toLowerCase())) return false;
        return [b.name, ...(b.alt_names ?? [])].some(n => n.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const aStart = [a.name, ...(a.alt_names ?? [])].some(n => n.toLowerCase().startsWith(q));
        const bStart = [b.name, ...(b.alt_names ?? [])].some(n => n.toLowerCase().startsWith(q));
        return (bStart ? 1 : 0) - (aStart ? 1 : 0);
      })
      .slice(0, 8);
  }, [input, guessedSet]);

  const submitGuess = (name) => {
    if (gameOver) return;
    const lower = name.toLowerCase().trim();
    const bossNames = [boss.name, ...(boss.alt_names ?? [])].map(n => n.toLowerCase());
    if (bossNames.includes(lower)) {
      setWon(true);
      setShowConfetti(true);
    } else {
      if (guessedSet.has(lower)) return;
      setWrongGuesses(prev => [...prev, name]);
      setShake(true);
      setTimeout(() => setShake(false), 420);
    }
    setInput('');
    setHlIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHlIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHlIndex(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (hlIndex >= 0 && suggestions[hlIndex]) submitGuess(suggestions[hlIndex].name);
      else if (suggestions.length > 0) submitGuess(suggestions[0].name);
    } else if (e.key === 'Escape') { setInput(''); setHlIndex(-1); }
  };

  const navigateDay = (delta) => {
    const next = shiftDate(selectedDateKey, delta);
    if (next >= earliestKey && next <= todayKey) setSelectedDateKey(next);
  };

  const handleShare = () => {
    const total = wrongGuesses.length + (won ? 1 : 0);
    const grid = [
      ...wrongGuesses.map(() => '🟥'),
      ...(won ? ['🟩'] : ['💀']),
    ].join(' ');
    const resultLine = won
      ? wrongGuesses.length === 0 ? `First try. isaac god.`
        : wrongGuesses.length <= 2 ? `${total}/${MAX_GUESSES} — solid.`
        : `${total}/${MAX_GUESSES} — needed most of the hints.`
      : `X/${MAX_GUESSES} — fully revealed and still clueless.`;
    const streakLine = streak > 0 ? `🔥 ${streak} day streak.` : '';
    navigator.clipboard.writeText(
      [`👹 TBOI Boss Finder — ${selectedDateKey}`, '', resultLine, ...(streakLine ? [streakLine] : []), '', grid, '', 'isaacarcade.com'].join('\n')
    ).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="bf-page">

      <canvas ref={confettiRef} className="bf-confetti-canvas" />

      {/* ── Top: logo · nav · streak ── */}
      <div className="bf-top">
        <img className="bf-logo" src="/logo.png" alt="Isaac Arcade" />
        <nav className="bf-nav">
          <Link className="bf-nav-link" to="/">Guess The Item</Link>
          <span className="bf-nav-current">Boss Finder</span>
        </nav>
        <div className={`bf-streak-top${streak === 0 ? ' bf-streak-zero' : ''}`} title="Daily streak">
          <img className="bf-fire" src={streak > 0 ? firegif : fireimg} alt="fire" />
          <p className="bf-streak-num">{streak}</p>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="bf-card-wrapper">
        <div className="bf-card">
          <h1 className="bf-title">Boss Finder</h1>

          {/* Date nav */}
          <div className="bf-date-nav">
            <button
              className="bf-date-nav-btn"
              onClick={() => navigateDay(-1)}
              disabled={selectedDateKey <= earliestKey}
            >‹</button>
            <span className="bf-date-label">{isToday ? 'Today' : selectedDateKey}</span>
            <button
              className="bf-date-nav-btn"
              onClick={() => navigateDay(1)}
              disabled={isToday}
            >›</button>
          </div>

          {/* Hints */}
          <section className="bf-hints">
            {boss.hints.slice(0, hintsRevealed).map((hint, i) => {
              const icon = HINT_ICONS[hint.type] ?? { label: hint.type, color: '#666' };
              return (
                <div key={i} className="bf-hint bf-hint-in">
                  <span className="bf-hint-badge" style={{ background: icon.color }}>
                    {icon.label}
                  </span>
                  <span className="bf-hint-text">{hint.text}</span>
                </div>
              );
            })}
            {!gameOver && hintsRevealed > 0 && (
              <p className="bf-hints-left">
                {MAX_GUESSES - hintsRevealed} hint{MAX_GUESSES - hintsRevealed !== 1 ? 's' : ''} left
              </p>
            )}
          </section>

          {/* Input */}
          {!gameOver && (
            <div className="bf-input-area">
              <div className={`bf-input-wrap${shake ? ' bf-shake' : ''}`}>
                <input
                  ref={inputRef}
                  className="bf-input"
                  value={input}
                  onChange={e => { setInput(e.target.value); setHlIndex(-1); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a boss name…"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {suggestions.length > 0 && (
                  <ul className="bf-suggestions">
                    {suggestions.map((b, i) => (
                      <li
                        key={b.id}
                        className={`bf-suggestion${i === hlIndex ? ' bf-suggestion--hl' : ''}`}
                        onMouseDown={e => { e.preventDefault(); submitGuess(b.name); }}
                      >
                        <span className="bf-sug-name">{b.name}</span>
                        {b.alt_names?.length ? (
                          <span className="bf-sug-alt"> / {b.alt_names.join(' / ')}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Wrong guesses */}
          {wrongGuesses.length > 0 && (
            <div className="bf-wrong-area">
              <p className="bf-wrong-label">Guesses · {wrongGuesses.length}/{MAX_GUESSES}</p>
              <div className="bf-wrong-tags">
                {wrongGuesses.map((g, i) => (
                  <span key={i} className="bf-wrong-tag">{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* Reveal */}
          {gameOver && (
            <div className="bf-reveal">
              {boss.image ? (
                <img
                  className="bf-boss-img"
                  src={boss.image}
                  alt={boss.name}
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <div className="bf-boss-img-missing">{boss.name}</div>
              )}
              <p className="bf-boss-name">{boss.name}</p>
              <p className={`bf-result-line ${won ? 'bf-result-won' : 'bf-result-lost'}`}>
                {won
                  ? wrongGuesses.length === 0 ? 'First try!' : `Got it in ${wrongGuesses.length + 1}.`
                  : 'Better luck tomorrow.'}
              </p>
              {isToday && (
                <p className="bf-countdown">
                  Next boss in <strong>{countdown}</strong>
                </p>
              )}
              <div className="bf-end-btns">
                <a className="bf-wiki-btn" href={boss.wiki} target="_blank" rel="noreferrer">
                  Wiki ↗
                </a>
                <button ref={endRef} className="bf-share-btn" onClick={handleShare}>
                  {copied ? '✅ Copied!' : '📋 Share'}
                </button>
              </div>
              {isToday && (
                <button className="bf-prev-btn" onClick={() => navigateDay(-1)}>
                  ‹ Play Previous Days
                </button>
              )}
              <p className="bf-also-play">
                Also try <Link className="bf-also-link" to="/">Guess The Item</Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Ko-fi ── */}
      <div className="bf-buttons-container">
        <a href="https://ko-fi.com/E1E81M8I3S" target="_blank" rel="noopener noreferrer">
          <img className="bf-kofi" src="https://storage.ko-fi.com/cdn/kofi5.png?v=6" border="0" alt="Buy Me a Coffee at ko-fi.com" />
        </a>
      </div>

    </div>
  );
}
