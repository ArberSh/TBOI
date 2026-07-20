import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import GuessTheItem from './GuessTheItem'

const BOSS_ROUTE = '/boss-preview-x7k2m9'
const BossFinder = lazy(() => import('./BossFinder'))

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuessTheItem />} />
        <Route
          path={BOSS_ROUTE}
          element={
            <Suspense fallback={null}>
              <BossFinder />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
