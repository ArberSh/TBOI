import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

const BOSS_ROUTE = '/boss-preview-x7k2m9'
const Home         = lazy(() => import('./Home'))
const GuessTheItem = lazy(() => import('./GuessTheItem'))
const BossFinder   = lazy(() => import('./BossFinder'))

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Suspense fallback={null}><Home /></Suspense>} />
        <Route path="/guess-the-item" element={<Suspense fallback={null}><GuessTheItem /></Suspense>} />
        <Route
          path={BOSS_ROUTE}
          element={<Suspense fallback={null}><BossFinder /></Suspense>}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
