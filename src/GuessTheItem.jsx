import React, { useState, useMemo, useEffect, useRef } from 'react';
import "./GuessTheItem.css";
import ITEMS_DATABASE from "./itemsData.json";

// Each number = how many pixels the image is rendered at (higher = more detail)
const PIXEL_STEPS = [4, 8, 16, 16, 32, 64];

function GuessTheItem() {
  const [userGuess, setUserGuess] = useState("");
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const canvasRef = useRef(null);

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
        // Full crisp reveal on correct guess
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, W, H);
      } else {
        // Draw at low resolution then scale up pixelated
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
    if (userGuess.toLowerCase().trim() === dailyItem.name.toLowerCase()) {
      setHasGuessedCorrectly(true);
    } else if (stepIndex < PIXEL_STEPS.length - 1) {
      setStepIndex(prev => prev + 1);
    }
    setUserGuess("");
  };

  const attemptsLeft = PIXEL_STEPS.length - 1 - stepIndex;

  return (
    <div className='Container-all'>
      <div className='Container'>
        <h1>Can you guess this item?</h1>

        <div className='Container-image'>
          <canvas ref={canvasRef} width={192} height={192} className="image-item" />
        </div>

        {!hasGuessedCorrectly && !gameOver && (
          <p className="attempts-text">Attempts left: {attemptsLeft}</p>
        )}

        {!hasGuessedCorrectly && !gameOver && (
          <div>
            <input
              type="text"
              value={userGuess}
              onChange={(e) => setUserGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckGuess()}
              placeholder="Type item name..."
            />
            <button onClick={handleCheckGuess}>Submit</button>
          </div>
        )}

        {hasGuessedCorrectly && <h2>Correct! It's {dailyItem.name}!</h2>}
        {gameOver && <h2>It was {dailyItem.name}!</h2>}
      </div>
    </div>
  );
}

export default GuessTheItem;
