import { Link } from 'react-router-dom';
import { useOnceFlag } from './useOnceFlag';
import './WelcomeModal.css';

export default function WelcomeModal() {
  const [show, dismiss] = useOnceFlag('isaacArcadeWelcomeSeen');

  if (!show) return null;

  return (
    <div className="wm-overlay" onClick={dismiss}>
      <div className="wm-card" onClick={(e) => e.stopPropagation()}>
        <button className="wm-close" onClick={dismiss} aria-label="Close">×</button>

        <h2 className="wm-title">Welcome to Isaac Arcade</h2>
        <p className="wm-text">
          Two free daily puzzles for <em>The Binding of Isaac</em> fans — a new
          item and a new boss to identify every day, reset at midnight UTC.
        </p>

        <ul className="wm-list">
          <li><strong>Guess the Item</strong> — name the daily item before it fully sharpens from a pixelated blur.</li>
          <li><strong>Boss Finder</strong> — name the daily boss from clues about how it fights, not what it looks like.</li>
        </ul>

        <p className="wm-text">Miss a day? The last two weeks are always in the archive.</p>

        <button className="wm-btn" onClick={dismiss}>Let's go!</button>
        <Link to="/about" className="wm-link" onClick={dismiss}>Read more about this site</Link>
      </div>
    </div>
  );
}
