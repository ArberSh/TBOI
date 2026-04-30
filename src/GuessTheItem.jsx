import React, { useState, useMemo, useEffect, useRef } from 'react';
import "./GuessTheItem.css";
import ITEMS_DATABASE from "./itemsData.json";

const PIXEL_STEPS = [8, 16, 16, 32, 32, 64];

const CONFETTI_COLORS = [
  '#f0b840', '#5ddb6a', '#e05c5c', '#60c8f0', '#c86af0',
  '#f07840', '#f0e040', '#40f0c8', '#f040a0'
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

function GuessTheItem() {
  const now = new Date();
  const todayKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;

  const loadGameState = () => {
    const saved = JSON.parse(localStorage.getItem('tboiGameState') || '{}');
    if (saved.date === todayKey) return saved;
    return null;
  };

  const [userGuess, setUserGuess] = useState("");
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(() => loadGameState()?.hasGuessedCorrectly ?? false);
  const [stepIndex, setStepIndex] = useState(() => loadGameState()?.stepIndex ?? 0);
  const [wrongGuesses, setWrongGuesses] = useState(() => loadGameState()?.wrongGuesses ?? []);
  const [hintRevealed, setHintRevealed] = useState(() => loadGameState()?.hintRevealed ?? false);
  const [shake, setShake] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [streak, setStreak] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('tboiStreak') || '{}');
    const { lastPlayedDate, streak: saved = 0 } = stored;
    if (lastPlayedDate === todayKey) return saved;
    const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const yesterdayKey = `${yesterday.getUTCFullYear()}-${yesterday.getUTCMonth()}-${yesterday.getUTCDate()}`;
    return lastPlayedDate === yesterdayKey ? saved : 0;
  });
  const [playedToday, setPlayedToday] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('tboiStreak') || '{}');
    return stored.lastPlayedDate === todayKey;
  });

  const canvasRef = useRef(null);
  const confettiRef = useRef(null);
  const inputRef = useRef(null);
  const rafRef = useRef(null);
  const suggestionsRef = useRef(null);

  const saveStreak = (currentStreak, alreadyPlayed, won = true) => {
  if (alreadyPlayed) return;
  const newStreak = won ? currentStreak + 1 : 0;
  localStorage.setItem('tboiStreak', JSON.stringify({ lastPlayedDate: todayKey, streak: newStreak }));
  setStreak(newStreak);
  setPlayedToday(true);
};

  const suggestions = useMemo(() => {
  if (!userGuess.trim()) return [];
  const lower = userGuess.trim().toLowerCase();
  const guessed = new Set(wrongGuesses.map(g => g.toLowerCase()));
  const available = ITEMS_DATABASE.filter(item =>
    item.name.toLowerCase().includes(lower) &&
    !guessed.has(item.name.toLowerCase())
  );
  const startsWith = available.filter(item =>
    item.name.toLowerCase().startsWith(lower)
  );
  const rest = available.filter(item =>
    !item.name.toLowerCase().startsWith(lower)
  );
  return [...startsWith, ...rest].slice(0, 12);
}, [userGuess, wrongGuesses]);

 const dailyItem = useMemo(() => {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startDate = Date.UTC(2024, 0, 1);
  const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

  const todayIdx     = dayIndex % ITEMS_DATABASE.length;
  const yesterdayIdx = (dayIndex - 1) % ITEMS_DATABASE.length;

  // If the cycle wraps and lands on the same item as yesterday, skip one forward
  if (ITEMS_DATABASE[todayIdx].name === ITEMS_DATABASE[yesterdayIdx].name) {
    return ITEMS_DATABASE[(todayIdx + 1) % ITEMS_DATABASE.length];
  }

  return ITEMS_DATABASE[todayIdx];
}, []);

  const currentPixelSize = PIXEL_STEPS[stepIndex];
  const gameOver = stepIndex === PIXEL_STEPS.length - 1 && !hasGuessedCorrectly;

  // Item image rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dailyItem) return;

    const img = new Image();
    img.src = dailyItem.image;
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (hasGuessedCorrectly) {
        const off = document.createElement('canvas');
        off.width = 128; off.height = 128;
        const offCtx = off.getContext('2d');
        offCtx.imageSmoothingEnabled = false;
        offCtx.drawImage(img, 0, 0, 128, 128);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, 128, 128, 0, 0, W, H);
      } else {
        const res = currentPixelSize;
        const off = document.createElement('canvas');
        off.width = res; off.height = res;
        const offCtx = off.getContext('2d');
        offCtx.imageSmoothingEnabled = false;
        offCtx.drawImage(img, 0, 0, res, res);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, res, res, 0, 0, W, H);
      }
    };
  }, [dailyItem, stepIndex, hasGuessedCorrectly, currentPixelSize]);

  // Persist game state for today
  useEffect(() => {
    localStorage.setItem('tboiGameState', JSON.stringify({
      date: todayKey,
      hasGuessedCorrectly,
      stepIndex,
      wrongGuesses,
      hintRevealed,
    }));
  }, [hasGuessedCorrectly, stepIndex, wrongGuesses, hintRevealed, todayKey]);

  // Confetti animation
  useEffect(() => {
    if (!hasGuessedCorrectly) return;
    const canvas = confettiRef.current;
    if (!canvas) return;

    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    let particles = createParticles(W, H);

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotV;
        p.vy += 0.12;
        p.alpha -= 0.007;

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
      if (particles.length > 0) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hasGuessedCorrectly]);

  const handleCheckGuess = (overrideName) => {
    const trimmed = (overrideName ?? userGuess).trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === dailyItem.name.toLowerCase()) {
  setHasGuessedCorrectly(true);
  saveStreak(streak, playedToday, true);   // ← won: true
} else {
  setWrongGuesses(prev => [...prev, trimmed]);
  setShake(true);
  setTimeout(() => setShake(false), 500);
  if (stepIndex < PIXEL_STEPS.length - 1) {
    setStepIndex(prev => prev + 1);
  } else {
    saveStreak(streak, playedToday, false); // ← won: false → resets to 0
  }
}
    setUserGuess("");
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) {
      if (e.key === 'Enter') handleCheckGuess();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      setUserGuess("");
      if (highlightedIndex >= 0) {
        handleCheckGuess(suggestions[highlightedIndex].name);
        setHighlightedIndex(-1);
      } else if (suggestions.length > 0) {
        handleCheckGuess(suggestions[0].name);
      } else {
        handleCheckGuess();
      }
    } else if (e.key === 'Escape') {
      setHighlightedIndex(-1);
      setUserGuess("");
    }
  };

  const attemptsLeft = PIXEL_STEPS.length - 1 - stepIndex;

  return (
    <div className="page">
      <div className='Top'>
        <div>
          <img className='logo' src="/logo.png" alt="logo" />
        </div>
      {/* Fixed top-right streak */}
      <div
        className={`streak-top ${streak === 0 || gameOver ? 'streak-zero' : ''}`}
        title="Daily streak"
      >
         {streak} day{streak !== 1 ? 's' : ''}
      </div>

      </div>
      <canvas ref={confettiRef} className="confetti-canvas" />

      <div className="card">
        <h1 className="title">Guess the Item</h1>
        <p className="subtitle">Daily TBOI Challenge</p>

        <div className="top-row">
          <span className={`difficulty-badge diff-${dailyItem.difficulty}`}>{dailyItem.difficulty}</span>
        </div>

        {/* Step progress dots */}
        <div className="steps">
          {PIXEL_STEPS.map((px, i) => (
            <div
              key={i}
              className={`step-dot ${i < stepIndex ? 'step-done' : i === stepIndex ? 'step-active' : 'step-future'}`}
              title={`${px}px`}
            />
          ))}
        </div>

        {/* Image */}
        <div className={`image-wrapper ${shake ? 'shake' : ''} ${hasGuessedCorrectly ? 'glow-correct' : ''}`}>
          <canvas ref={canvasRef} width={180} height={180} className="item-canvas" />
        </div>

        {/* Status */}
        {!hasGuessedCorrectly && !gameOver && (
          <p className="hint-text">{attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining</p>
        )}
        {hasGuessedCorrectly && (
          <p className="result-text correct">✓ {dailyItem.name}</p>
        )}
        {gameOver && (
          <p className="result-text wrong">It was: {dailyItem.name}</p>
        )}

        {/* Hint */}
        {!hasGuessedCorrectly && !gameOver && (
          <div className="hint-row">
            {hintRevealed ? (
              <p className="hint-revealed">
                 Starts with <strong>" {dailyItem.name[0]} "</strong> · {dailyItem.name.split(" ").length} word{dailyItem.name.split(" ").length !== 1 ? "s" : ""} · {dailyItem.name.length} letters
              </p>
            ) : (
              <button className="hint-btn" onClick={() => setHintRevealed(true)}>
                💡 Show Hint
              </button>
            )}
          </div>
        )}

        {/* Wrong guesses */}
        {wrongGuesses.length > 0 && (
          <div className="wrong-guesses">
            {wrongGuesses.map((g, i) => (
              <span key={i} className="wrong-tag">{g}</span>
            ))}
          </div>
        )}

        {/* Input */}
        {!hasGuessedCorrectly && !gameOver && (
          <div className="input-wrapper">
            <div className="input-row">
              <input
                ref={inputRef}
                type="text"
                value={userGuess}
                onChange={(e) => { setUserGuess(e.target.value); setHighlightedIndex(-1); }}
                onKeyDown={handleKeyDown}
                placeholder="Type item name..."
                className="guess-input"
                autoComplete="off"
                autoFocus
              />
              <button onClick={() => handleCheckGuess()} className="guess-btn">Submit</button>
            </div>
            {suggestions.length > 0 && (
              <ul className="suggestions-list" ref={suggestionsRef}>
                {suggestions.map((item, i) => (
                  <li
                    key={item.name}
                    className={`suggestion-item ${i === highlightedIndex ? 'suggestion-highlighted' : ''}`}
                    onMouseDown={() => handleCheckGuess(item.name)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                  >
                    <img src={item.image} alt="" className="suggestion-img" />
                    {item.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      
      <div className="Buttons_Container">
        {/* Ko-fi button */}
      {/* <a 
        href="https://ko-fi.com/arbershaska34991"
        target="_blank"
        rel="noopener noreferrer"
        className="kofi-btn"
      >
        <img className='logoKo-fi' src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' />
       
      </a> */}
      <a href='https://ko-fi.com/E1E81M8I3S' target='_blank'>
      <img className='logoko-fi' src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' />
      </a>
      </div>
    </div>
  );
}

export default GuessTheItem;