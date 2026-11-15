import { useOnceFlag } from './useOnceFlag';
import './WelcomeModal.css';

export default function GtiIntroModal() {
  const [show, dismiss] = useOnceFlag('isaacArcadeGtiIntroSeen');

  if (!show) return null;

  return (
    <div className="wm-overlay" onClick={dismiss}>
      <div className="wm-card" onClick={(e) => e.stopPropagation()}>
        <button className="wm-close" onClick={dismiss} aria-label="Close">×</button>

        <h2 className="wm-title">Guess the Item</h2>
        <p className="wm-text">
          Each day we pick one collectible from <em>The Binding of Isaac</em> and
          reveal it pixel by pixel. Name it before the reveals run out.
        </p>

        <ul className="wm-list">
          <li>Every wrong guess sharpens the image one step further.</li>
          <li>Flip on <strong>Hard Mode</strong> to strip the color and guess from shape alone.</li>
          <li>Use the ‹ › arrows to replay items from the last two weeks.</li>
        </ul>

        <button className="wm-btn" onClick={dismiss}>Let's guess!</button>
      </div>
    </div>
  );
}
