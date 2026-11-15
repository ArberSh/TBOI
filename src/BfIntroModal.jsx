import { useOnceFlag } from './useOnceFlag';
import './WelcomeModal.css';

export default function BfIntroModal() {
  const [show, dismiss] = useOnceFlag('isaacArcadeBfIntroSeen');

  if (!show) return null;

  return (
    <div className="wm-overlay" onClick={dismiss}>
      <div className="wm-card" onClick={(e) => e.stopPropagation()}>
        <button className="wm-close" onClick={dismiss} aria-label="Close">×</button>

        <h2 className="wm-title">Boss Finder</h2>
        <p className="wm-text">
          Every day we pick one boss and describe how it fights — one clue at a
          time — without ever naming it.
        </p>

        <ul className="wm-list">
          <li>You get six guesses to name the boss from its attacks alone.</li>
          <li>Clues describe behavior, never the sprite — know the fight, not just the look.</li>
          <li>Use the ‹ › arrows to replay bosses from the last two weeks.</li>
        </ul>

        <button className="wm-btn" onClick={dismiss}>Let's find it!</button>
      </div>
    </div>
  );
}
