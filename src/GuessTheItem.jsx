import React, { useState, useMemo, useEffect, useRef } from 'react';
import "./GuessTheItem.css";
import ITEMS_DATABASE from "./itemsData.json";

const PIXEL_STEPS = [4, 8, 16, 16, 32, 64];

function GuessTheItem() {
  const [userGuess, setUserGuess] = useState("");
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [wrongGuesses, setWrongGuesses] = useState([]);
  const [shake, setShake] = useState(false);
  const canvasRef = useRef(null);
  const inputRef = useRef(null);

  const dailyItem = useMemo(() => {
    const startDate = new Date("2024-01-01").getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    return ITEMS_DATABASE[dayIndex % ITEMS_DATABASE.length];
  }, []);

  const currentPixelSize = PIXEL_STEPS[stepIndex];
  const gameOver = stepIndex === PIXEL_STEPS.length - 1 && !hasGuessedCorrectly;

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
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, W, H);
      } else {
        const res = currentPixelSize;
        const offscreen = document.createElement('canvas');
        offscreen.width = res;
        offscreen.height = res;
        const offCtx = offscreen.getContext('2d');
        offCtx.imageSmoothingEnabled = false;
        offCtx.drawImage(img, 0, 0, res, res);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offscreen, 0, 0, res, res, 0, 0, W, H);
      }
    };
  }, [dailyItem, stepIndex, hasGuessedCorrectly, currentPixelSize]);

  const handleCheckGuess = () => {
    const trimmed = userGuess.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === dailyItem.name.toLowerCase()) {
      setHasGuessedCorrectly(true);
    } else {
      setWrongGuesses(prev => [...prev, trimmed]);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (stepIndex < PIXEL_STEPS.length - 1) {
        setStepIndex(prev => prev + 1);
      }
    }
    setUserGuess("");
    inputRef.current?.focus();
  };

  const attemptsLeft = PIXEL_STEPS.length - 1 - stepIndex;

  return (
    <div className="page">
      <div className="card">

        <h1 className="title">Guess the Item</h1>
        <p className="subtitle">Daily TBOI Challenge</p>

        {/* Step progress dots */}
        <div className="steps">
          {PIXEL_STEPS.map((px, i) => (
            <div
              key={i}
              className={`step-dot ${i < stepIndex ? 'step-done' : i === stepIndex ? 'step-active' : 'step-future'}`}
              title={`${px}px`}
            >
              {px}
            </div>
          ))}
        </div>

        {/* Image */}
        <div className={`image-wrapper ${shake ? 'shake' : ''} ${hasGuessedCorrectly ? 'glow-correct' : ''}`}>
          <canvas ref={canvasRef} width={180} height={180} className="item-canvas" />
        </div>

        {/* Status */}
        {!hasGuessedCorrectly && !gameOver && (
          <p className="hint-text">{attemptsLeft} hint{attemptsLeft !== 1 ? 's' : ''} remaining</p>
        )}
        {hasGuessedCorrectly && (
          <p className="result-text correct">✓ {dailyItem.name}</p>
        )}
        {gameOver && (
          <p className="result-text wrong">It was: {dailyItem.name}</p>
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
          <div className="input-row">
            <input
              ref={inputRef}
              type="text"
              value={userGuess}
              onChange={(e) => setUserGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckGuess()}
              placeholder="Type item name..."
              className="guess-input"
              autoFocus
            />
            <button onClick={handleCheckGuess} className="guess-btn">Submit</button>
          </div>
        )}

      </div>
    </div>
  );
}

export default GuessTheItem;
