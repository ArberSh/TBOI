import React, { useState, useMemo } from 'react';
import "./GuessTheItem.css";

// 1. Move the data generation OUTSIDE the component
const ITEMS_DATABASE = [];
const rebirthItemCount = 341;

for (let i = 1; i <= rebirthItemCount; i++) {
    if ([43, 61, 263].includes(i)) continue;
    ITEMS_DATABASE.push({
        id: i,
        name: "Item " + i, // In your real version, use the actual names
        image: `/images/items/collectibles_${i.toString().padStart(3, '0')}.png` 
    });
}

function GuessTheItem() {
  const [userGuess, setUserGuess] = useState("");
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false);

  // 2. The "Wordle" Logic: Pick one item based on the date
  const dailyItem = useMemo(() => {
    const startDate = new Date("2024-01-01").getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    // Use modulo to loop back if we run out of items
    return ITEMS_DATABASE[dayIndex % ITEMS_DATABASE.length];
  }, []);

  const handleCheckGuess = () => {
    // Basic sanitization: lowercase and remove spaces
    if (userGuess.toLowerCase().trim() === dailyItem.name.toLowerCase()) {
      setHasGuessedCorrectly(true);
      alert("Correct! It was " + dailyItem.name);
    } else {
      alert("Try again!");
    }
  };

  return (
    <div className='Container-all'>
      <div className='Container'>
        <h1>Can you guess this item?</h1>
        
        <div className='Container-image'>
          {/* 3. The Source Path Fix */}
          <img 
            src={dailyItem.image} 
            alt="Guess the item" 
            style={{ filter: hasGuessedCorrectly ? 'none' : 'brightness(0)' }} 
          />
          {/* Tip: The brightness(0) makes it a silhouette like Pokemon! */}
        </div>

        <div>
          <input 
            type="text" 
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            placeholder="Type item name..."
          />
          <button onClick={handleCheckGuess}>Submit</button>
        </div>

        {hasGuessedCorrectly && <h2>It's {dailyItem.name}!</h2>}
      </div>
    </div>
  );
}

export default GuessTheItem;