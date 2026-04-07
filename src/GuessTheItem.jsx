import React from 'react'
import "./GuessTheItem.css"

function GuessTheItem() {

  const items = [];
const rebirthItemCount = 341;

// Helper to determine difficulty based on common community knowledge
const getCategory = (id) => {
    const easy = [1, 118, 114, 52, 149, 10, 182, 64, 34]; // Onion, Brim, Knife, D6, etc.
    const impossible = [111, 288, 291, 135, 188]; // Bean, Box of Spiders, Flush, IV Bag, Abel
    if (easy.includes(id)) return "easy";
    if (impossible.includes(id)) return "impossible";
    return id % 3 === 0 ? "hard" : "medium"; // Logic-based filler to start
};

for (let i = 1; i <= rebirthItemCount; i++) {
    // Some IDs in Rebirth are empty or non-collectibles
    if ([43, 61, 263].includes(i)) continue; 

    items.push({
        "id": i,
        "name": "", // You can map this from the GitHub filenames
        "category": getCategory(i),
        "type": i < 100 ? "passive" : "active", // Placeholder logic
        "pool": ["treasure_room"], // Default
        "effect": "Description here...",
        "image": `/public/images/items/collectibles_${i.toString().padStart(3, '0')}.png`,
        "tags": []
    });
}

console.log(JSON.stringify(items, null, 2));


  return (
    <div className='Container-all'>

        <div className='Container'>
            <h1>Can you guess this item?</h1>
            <div className='Container-image'>
            <img src="/public/images/items/canvas.png" alt="" /> 
            {/* provo t gjesh te github fotot  */}
            </div>
            <div>
              <input type="text" name="" id="" />
              <button>Submit</button>
            </div>
        </div>

    </div>
  )
}

export default GuessTheItem