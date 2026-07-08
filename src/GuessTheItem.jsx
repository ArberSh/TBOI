import React, { useState, useMemo, useEffect, useRef, useCallback} from 'react';
import "./GuessTheItem.css";
import ITEMS_DATABASE from "./itemsData.json";
import firegif from "./assets/fire.gif"
import fireimg from "./assets/fireimg.png"
import { supabase } from './supabase';

const PIXEL_STEPS = [8, 12, 16, 16, 24, 32, 64];

const CONFETTI_COLORS = [
  '#f0b840', '#5ddb6a', '#e05c5c', '#60c8f0', '#c86af0',
  '#f07840', '#f0e040', '#40f0c8', '#f040a0'
];

function getTimeUntilMidnightUTC() {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  ));
  const diff = midnight - now;
  const h = String(Math.floor(diff / 1000 / 60 / 60)).padStart(2, '0');
  const m = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
  const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

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

function getTodayKey() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

function getDayIndex(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const startDate = Date.UTC(2024, 0, 1);
  return Math.floor((target - startDate) / (1000 * 60 * 60 * 24));
}

function getItemForDay(dayIndex) {
  const todayIdx = dayIndex % ITEMS_DATABASE.length;
  const yesterdayIdx = (dayIndex - 1 + ITEMS_DATABASE.length) % ITEMS_DATABASE.length;
  if (ITEMS_DATABASE[todayIdx].name === ITEMS_DATABASE[yesterdayIdx].name) {
    return ITEMS_DATABASE[(todayIdx + 1) % ITEMS_DATABASE.length];
  }
  return ITEMS_DATABASE[todayIdx];
}

function loadGameState(dateKey) {
  const perDateKey = `tboiGameState_${dateKey}`;
  const perDate = JSON.parse(localStorage.getItem(perDateKey) || '{}');
  if (perDate.date === dateKey) return perDate;
  // migrate legacy key for today
  const legacy = JSON.parse(localStorage.getItem('tboiGameState') || '{}');
  if (legacy.date === dateKey) {
    localStorage.setItem(perDateKey, JSON.stringify(legacy));
    return legacy;
  }
  return null;
}


function GuessTheItem() {

  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingVisible, setLoadingVisible] = useState(true);
  const [loadingFading, setLoadingFading] = useState(false);

  useEffect(() => {
    const items = ITEMS_DATABASE.filter(item => item.image);
    const total = items.length;
    if (total === 0) {
      setLoadingFading(true);
      setTimeout(() => setLoadingVisible(false), 600);
      return;
    }
    const half = Math.ceil(total / 2);
    const firstBatch = items.slice(0, half);
    const secondBatch = items.slice(half);

    let loaded = 0;
    firstBatch.forEach(item => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        setLoadProgress(Math.round((loaded / half) * 100));
        if (loaded === half) {
          setLoadingFading(true);
          setTimeout(() => {
            setLoadingVisible(false);
            secondBatch.forEach(item2 => {
              const img2 = new Image();
              img2.src = item2.image;
            });
          }, 600);
        }
      };
      img.src = item.image;
    });
  }, []);

  const [todayKey, setTodayKey] = useState(getTodayKey);
  const [selectedDateKey, setSelectedDateKey] = useState(getTodayKey);

  const [userGuess, setUserGuess] = useState("");
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(() => loadGameState(getTodayKey())?.hasGuessedCorrectly ?? false);
  const [stepIndex, setStepIndex] = useState(() => loadGameState(getTodayKey())?.stepIndex ?? 0);
  const [wrongGuesses, setWrongGuesses] = useState(() => loadGameState(getTodayKey())?.wrongGuesses ?? []);
  const [hintRevealed, setHintRevealed] = useState(() => loadGameState(getTodayKey())?.hintRevealed ?? false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showNameReveal, setShowNameReveal] = useState(() => loadGameState(getTodayKey())?.hasGuessedCorrectly ?? false);
  const [streak, setStreak] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('tboiStreak') || '{}');
    const { lastPlayedDate, streak: saved = 0 } = stored;
    if (lastPlayedDate === todayKey) return saved;
    // ✅ use getTodayKey logic inline here instead of now/pad
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const pad = n => String(n).padStart(2, '0');
    const yesterdayKey = `${yesterday.getUTCFullYear()}-${pad(yesterday.getUTCMonth() + 1)}-${pad(yesterday.getUTCDate())}`;
    return lastPlayedDate === yesterdayKey ? saved : 0;
  });

  const [playedToday, setPlayedToday] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('tboiStreak') || '{}');
    return stored.lastPlayedDate === todayKey;
  });
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(getTimeUntilMidnightUTC());
  const [guessStats, setGuessStats] = useState({ wins: 0, total: 0 }); // ✅ moved inside component

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
    return [...startsWith, ...rest].slice(0, 7);
  }, [userGuess, wrongGuesses]);

  const dailyItem = useMemo(() => {
    return getItemForDay(getDayIndex(selectedDateKey));
  }, [selectedDateKey]);

  const isToday = selectedDateKey === todayKey;

  const earliestKey = useMemo(() => {
    const [y, m, d] = todayKey.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d - 15));
    const pad = n => String(n).padStart(2, '0');
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  }, [todayKey]);

  const navigateDay = (delta) => {
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + delta));
    const pad = n => String(n).padStart(2, '0');
    const nextKey = `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
    if (nextKey >= earliestKey && nextKey <= todayKey) setSelectedDateKey(nextKey);
  };

  const currentPixelSize = PIXEL_STEPS[stepIndex];
  const gameOver = wrongGuesses.length >= PIXEL_STEPS.length - 1 && !hasGuessedCorrectly;
  const [canvasSize, setCanvasSize] = useState(0);

  // Item image rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dailyItem) return;

    let cancelled = false;

    const img = new Image();
    img.src = dailyItem.image;
    img.onload = () => {
      if (cancelled) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Normalize to 64×64 with smoothing first — makes downsampling deterministic
      // across browsers/GPUs (averaged pixels, not arbitrary nearest-neighbor samples).
      const base = document.createElement('canvas');
      base.width = 64; base.height = 64;
      const baseCtx = base.getContext('2d');
      baseCtx.imageSmoothingEnabled = true;
      baseCtx.drawImage(img, 0, 0, 64, 64);

      if (hasGuessedCorrectly) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(base, 0, 0, 64, 64, 0, 0, W, H);
      } else {
        const res = currentPixelSize;
        const off = document.createElement('canvas');
        off.width = res; off.height = res;
        const offCtx = off.getContext('2d');
        offCtx.imageSmoothingEnabled = true;
        offCtx.drawImage(base, 0, 0, 64, 64, 0, 0, res, res);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, res, res, 0, 0, W, H);
      }
    };

    return () => { cancelled = true; };
  }, [dailyItem, stepIndex, hasGuessedCorrectly, currentPixelSize, canvasSize]);

  useEffect(() => {
    const checkDate = () => {
      const newKey = getTodayKey();
      setTodayKey(prev => (prev !== newKey ? newKey : prev));
    };

    const interval = setInterval(checkDate, 30_000);
    document.addEventListener('visibilitychange', checkDate);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', checkDate);
    };
  }, []);

// When the calendar day rolls over, jump to the new today
useEffect(() => {
  setSelectedDateKey(todayKey);
}, [todayKey]);

// Reload all game state whenever the viewed date changes
useEffect(() => {
  const saved = loadGameState(selectedDateKey);
  if (saved) {
    setHasGuessedCorrectly(saved.hasGuessedCorrectly ?? false);
    setStepIndex(saved.stepIndex ?? 0);
    setWrongGuesses(saved.wrongGuesses ?? []);
    setHintRevealed(saved.hintRevealed ?? false);
    setShowNameReveal(saved.hasGuessedCorrectly ?? false);
  } else {
    setHasGuessedCorrectly(false);
    setStepIndex(0);
    setWrongGuesses([]);
    setHintRevealed(false);
    setShowNameReveal(false);
  }
  setShowConfetti(false);
  setUserGuess("");
  setHighlightedIndex(-1);
}, [selectedDateKey]);

  // Persist game state per date
  useEffect(() => {
    localStorage.setItem(`tboiGameState_${selectedDateKey}`, JSON.stringify({
      date: selectedDateKey,
      hasGuessedCorrectly,
      stepIndex,
      wrongGuesses,
      hintRevealed,
    }));
  }, [hasGuessedCorrectly, stepIndex, wrongGuesses, hintRevealed, selectedDateKey]);

  // Confetti animation (only on a fresh win, not when loading an already-won archive)
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
  }, [showConfetti]);

  // Trigger the name-reveal animation shortly after winning
  useEffect(() => {
    if (!hasGuessedCorrectly) return;
    const t = setTimeout(() => setShowNameReveal(true), 200);
    return () => clearTimeout(t);
  }, [hasGuessedCorrectly]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const size = Math.round(canvas.offsetWidth * dpr);
      if (size > 0 && canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
        setCanvasSize(size);
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnightUTC());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Record that this player started today's game (only for today, not archive)
  useEffect(() => {
    if (!isToday) return;
    const existingState = loadGameState(todayKey);
    const alreadyDone = existingState?.hasGuessedCorrectly ||
      (existingState?.wrongGuesses?.length >= PIXEL_STEPS.length - 1);
    if (alreadyDone) return;

    const session = JSON.parse(localStorage.getItem('tboiSession') || '{}');
    if (session.date === todayKey) return;

    (async () => {
      const { data } = await supabase.from('daily_guesses').insert({
        item_name: dailyItem.name,
        date: todayKey,
        result: 'started',
      }).select('id').single();
      if (data?.id) {
        localStorage.setItem('tboiSession', JSON.stringify({ date: todayKey, rowId: data.id }));
      }
    })();
  }, [isToday, todayKey, dailyItem]);

  // Fetch today's guess stats from Supabase
  
    const fetchStats = useCallback(async () => {
  const { count: wins } = await supabase
    .from('daily_guesses')
    .select('*', { count: 'exact', head: true })
    .eq('date', selectedDateKey)
    .eq('result', 'win');

  const { count: total } = await supabase
    .from('daily_guesses')
    .select('*', { count: 'exact', head: true })
    .eq('date', selectedDateKey);

  setGuessStats({ wins: wins || 0, total: total || 0 });
}, [selectedDateKey]);

useEffect(() => {
  fetchStats();
}, [hasGuessedCorrectly, stepIndex, fetchStats]);

    

  const handleCheckGuess = async (overrideName) => {
    const trimmed = (overrideName ?? userGuess).trim();
    if (!trimmed) return;

    const exists = ITEMS_DATABASE.some(
      item => item.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const attemptsMade = stepIndex + 1;

    if (trimmed.toLowerCase() === dailyItem.name.toLowerCase()) {
      setHasGuessedCorrectly(true);
      setShowConfetti(true);
      if (isToday) {
        saveStreak(streak, playedToday, true);
        const session = JSON.parse(localStorage.getItem('tboiSession') || '{}');
        if (session.date === todayKey && session.rowId) {
          await supabase.from('daily_guesses').update({ result: 'win', attempts: attemptsMade }).eq('id', session.rowId);
        } else {
          await supabase.from('daily_guesses').insert({ item_name: dailyItem.name, date: todayKey, result: 'win', attempts: attemptsMade });
        }
        await new Promise(r => setTimeout(r, 300));
        await fetchStats();
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'game_completed', { result: 'win', attempts: attemptsMade });
        }
      }
    } else {
      setWrongGuesses(prev => [...prev, trimmed]);
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (stepIndex < PIXEL_STEPS.length - 1) {
        const nextIndex = stepIndex + 1;
        setStepIndex(nextIndex);

        if (nextIndex === PIXEL_STEPS.length - 1) {
          if (isToday) {
            saveStreak(streak, playedToday, false);
            const session = JSON.parse(localStorage.getItem('tboiSession') || '{}');
            if (session.date === todayKey && session.rowId) {
              await supabase.from('daily_guesses').update({ result: 'loss', attempts: PIXEL_STEPS.length }).eq('id', session.rowId);
            } else {
              await supabase.from('daily_guesses').insert({ item_name: dailyItem.name, date: todayKey, result: 'loss', attempts: PIXEL_STEPS.length });
            }
            await new Promise(r => setTimeout(r, 300));
            await fetchStats();
            if (typeof window.gtag === 'function') {
              window.gtag('event', 'game_completed', { result: 'loss', attempts: PIXEL_STEPS.length });
            }
          }
        }
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

  const handleShare = () => {
  const totalAttempts = wrongGuesses.length + (hasGuessedCorrectly ? 1 : 0);
  const maxAttempts = PIXEL_STEPS.length - 1;

  const grid = wrongGuesses.map(() => '🟥').concat(hasGuessedCorrectly ? ['🟩'] : []).join(' ');

  const streakLine = streak > 1
    ? `🔥 ${streak} days in a row. touch grass.`
    : streak === 1
    ? `day 1. don't get excited.`
    : `💀 streak: DEAD. embarrassing.`;

  const resultLine = hasGuessedCorrectly
    ? totalAttempts === 1
      ? `1/${maxAttempts-1} — recognized it fully pixelated. actual isaac nerd.`
      : totalAttempts === 2
      ? `2/${maxAttempts-1} — needed one hint. respectable i guess.`
      : totalAttempts <= 4
      ? `${totalAttempts}/${maxAttempts} — needed it half unblurred. casual detected.`
      : `${totalAttempts}/${maxAttempts} — waited until it was basically a photo. embarrassing.`
   : `X/${maxAttempts} — fully revealed and still clueless. do you even play this game?`;

  const text = [
    `🎮 Guess the TBOI Item — Daily Challenge`,
    ``,
    resultLine,
    streakLine,
    ``,
    grid,
    ``,
    `think you can do better? doubt it.`,
    `https://isaacarcade.com/`,
  ].join('\n');

  navigator.clipboard.writeText(text)
    .then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    })
    .catch(() => {});

    console.log('gameOver:', gameOver, 'stepIndex:', stepIndex, 'hasGuessedCorrectly:', hasGuessedCorrectly);
  };

  return (
    <div className="page">
      {loadingVisible && (
        <div className={`loading-screen${loadingFading ? ' loading-fading' : ''}`}>
          <img className="loading-logo" src="/logo.png" alt="logo" />
          <div className="loading-bar-container">
            <div className="loading-bar-fill" style={{ width: `${loadProgress}%` }} />
          </div>
          <p className="loading-text">Loading... {loadProgress}%</p>
          <p className="loading-subtext">Preloading all item images for a smooth experience</p>
        </div>
      )}
      <div className='Top'>
        <div>
          <img className='logo' src="/logo.png" alt="logo" />
        </div>
        <div
          className={`streak-top ${streak === 0 || gameOver ? 'streak-zero' : ''}`}
          title="Daily streak"
        >
          <img className='firepng' src={streak > 0 ? firegif : fireimg} alt="fire" style={{ width: '4.5rem', objectFit: 'contain' }} />
          <p className='centered'>{streak}</p>
        </div>
      </div>
      <canvas ref={confettiRef} className="confetti-canvas" />

      <div className="card-wrapper">
      <div className="card">
        <h1 className="title">Guess the Item</h1>
        <p className="subtitle">Daily TBOI Challenge</p>

        <div className="date-nav">
          <button
            className="date-nav-btn"
            onClick={() => navigateDay(-1)}
            disabled={selectedDateKey <= earliestKey}
          >‹</button>
          <span className="date-nav-label">
            {isToday ? 'Today' : selectedDateKey}
          </span>
          <button
            className="date-nav-btn"
            onClick={() => navigateDay(1)}
            disabled={isToday}
          >›</button>
        </div>

        {!isToday && (
          <button className="back-to-today-btn" onClick={() => setSelectedDateKey(todayKey)}>
            ▶ Play Today
          </button>
        )}

        <div className="top-row">
          <span className={`difficulty-badge diff-${dailyItem.difficulty}`}>{dailyItem.difficulty}</span>
        </div>

        <div className="steps">
          {PIXEL_STEPS.slice(1).map((px, i) => (
            <div
              key={i}
              className={`step-dot ${i < stepIndex ? 'step-done' : i === stepIndex ? 'step-active' : 'step-future'}`}
              title={`${px}px`}
            />
          ))}
        </div>

        <div className={`image-wrapper ${shake ? 'shake' : ''} ${hasGuessedCorrectly ? 'glow-correct' : ''}`}>
          <canvas ref={canvasRef} className="item-canvas" />
        </div>

        {hasGuessedCorrectly && (
          <div className={`name-reveal ${showNameReveal ? 'name-reveal--visible' : ''}`}>
            {dailyItem.name}
          </div>
        )}

        {!hasGuessedCorrectly && !gameOver && (
          <p className="hint-text">{attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining</p>
        )}
        {hasGuessedCorrectly && (
          <p className="result-text correct">Correct!</p>
        )}
        {gameOver && (
          <p className="result-text wrong">It was: {dailyItem.name}</p>
        )}

        {/* Stats card as hint */}
{!hasGuessedCorrectly && !gameOver && (
  <div className="hint-row">
    {hintRevealed ? (
       <div className='stats-row'>
                <div className='stat-description'>
                  <h2 className='stat-subtitle'>Type</h2>
                  <p className='stat-value'>{dailyItem.type ?? '—'}</p>
                </div>
                <div className='stat-description'>
                  <h2 className='stat-subtitle'>Quality</h2>
                  <p className='stat-value'>{dailyItem.quality ?? '—'}</p>
                </div>
                <div className='stat-description'>
                  <h2 className='stat-subtitle'>Unlock.</h2>
                  <p className='stat-value'>{dailyItem.unlockable ? 'Yes' : 'No'}</p>
                </div>
              </div>
    ) : (
      <button className="hint-btn" onClick={() => setHintRevealed(true)}>
        Show Hint
      </button>
    )}
  </div>
)}

        {wrongGuesses.length > 0 && (
          <div className="wrong-guesses">
            {wrongGuesses.map((g, i) => (
              <span key={i} className="wrong-tag">{g}</span>
            ))}
          </div>
        )}

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
          </div>
        )}

      {(hasGuessedCorrectly || gameOver) && (
  <div className="guess-stats">
    <p style={{color:'gray', textAlign:'center', fontSize:'18px'}}>
      {guessStats.total === 0 ? (
        'No players have guessed yet'
      ) : (
        <>
          <span style={{ color: '#ffffff' }}>
            {Math.round((guessStats.wins / guessStats.total) * 100)}%
          </span> of {guessStats.total} players guessed {isToday ? "today's" : "that day's"} item
        </>
      )}
    </p>
  </div>
)}
        {(hasGuessedCorrectly || gameOver) && isToday && (
          <p className="next-item-text" style={{ textAlign: "center" }}>
            Next item in <strong style={{ color: "#f0b840", letterSpacing: "1px" }}>{countdown}</strong>
          </p>
        )}

        {(hasGuessedCorrectly || gameOver) && (
          <button className="share-btn" onClick={handleShare}>
            {copied ? '✅ Copied!' : '📋 Share Result'}
          </button>
        )}

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

      <div className="Buttons_Container">
        <a href='https://ko-fi.com/E1E81M8I3S' target='_blank' rel='noopener noreferrer'>
          <img className='logoko-fi' src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' />
        </a>
      </div>
    </div>
  );
}

export default GuessTheItem;