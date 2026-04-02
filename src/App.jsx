import { useState } from 'react'

import './App.css'

function App() {
  // const [count, setCount] = useState(0)
fetch('https://raw.githubusercontent.com/Rchardon/RebirthItemTracker/master/items.json')
  .then(res => res.json())
  .then(data => console.log(data))
  
  
  return (

    <>
      <h1> The Binding of Isaac: MiniGames</h1>
      <h2>Guess the name of the item</h2>
      <img src="" alt="" />
    </>
  )
}

export default App
