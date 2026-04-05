import React from 'react'
import "./GuessTheItem.css"

function GuessTheItem() {
  return (
    <div className='Container-all'>

        <div className='Container'>
            <h1>Can you guess this item?</h1>
            <div className='Container-image'>
            <img src="/public/images/items/canvas.png" alt="" />
            </div>
        </div>

    </div>
  )
}

export default GuessTheItem