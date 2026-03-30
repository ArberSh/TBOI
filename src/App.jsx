import { useState } from 'react'

import './App.css'

function App() {
  // const [count, setCount] = useState(0)
fetch('https://raw.githubusercontent.com/Rchardon/RebirthItemTracker/master/items.json')
  .then(res => res.json())
  .then(data => console.log(data))

  
  return (

    <>

    </>
  )
}

export default App
