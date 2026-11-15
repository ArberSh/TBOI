import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  return (
    <div className="ab-page">
      <Link to="/" className="ab-logo-link">
        <img className="ab-logo" src="/logo.png" alt="Isaac Arcade" />
      </Link>

      <div className="ab-card">
        <Link to="/" className="ab-back">← Back to Isaac Arcade</Link>

        <h1 className="ab-title">About Isaac Arcade</h1>
        <p className="ab-updated">Two free daily puzzles for Binding of Isaac fans</p>

        <section className="ab-section">
          <h2 className="ab-heading">What is this?</h2>
          <p>
            Isaac Arcade is a small collection of daily browser puzzles built around
            <em> The Binding of Isaac</em>. Instead of one big game, we run two short
            challenges that reset every day at midnight UTC — play either one in under
            a minute, or dig into the archive to catch up on days you missed.
          </p>
        </section>

        <section className="ab-section">
          <h2 className="ab-heading">Guess the Item</h2>
          <p>
            We take one collectible from the game's item pool and render it as a heavily
            pixelated silhouette. Each wrong guess reveals more detail — the image sharpens
            in seven steps, from an unrecognizable 4×4 block up to a clean, full-resolution
            sprite. Guess the item's name before the reveals run out to keep your streak alive.
            Turning on <strong>Hard Mode</strong> strips the color out of the sprite entirely,
            so you're reading shape alone.
          </p>
        </section>

        <section className="ab-section">
          <h2 className="ab-heading">Boss Finder</h2>
          <p>
            Every day we pick one boss and describe how it fights — its attack pattern,
            movement, and arena behavior — one clue at a time, without ever naming it.
            You get six guesses to identify the boss purely from its combat behavior.
            It's a test of how well you actually know each fight, not just what the
            sprite looks like.
          </p>
        </section>

        <section className="ab-section">
          <h2 className="ab-heading">Streaks &amp; the archive</h2>
          <p>
            Both games track a daily streak in your browser, and both let you step
            backward through the last two weeks of past puzzles if you want to catch up
            or replay a day you missed. Nothing is stored on a server tied to your
            identity — your progress lives in your browser's local storage.
          </p>
        </section>

        <section className="ab-section">
          <h2 className="ab-heading">FAQ</h2>
          <p><strong>Do I need an account?</strong> No. Everything runs locally in your browser.</p>
          <p><strong>When does a new puzzle drop?</strong> Midnight UTC, every day, for both games.</p>
          <p><strong>Will my streak survive a browser change?</strong> No — streaks and progress are stored per-browser, not per-account.</p>
          <p><strong>More games coming?</strong> We're actively adding to the boss and item pools and may add more daily modes over time.</p>
        </section>

        <section className="ab-section">
          <h2 className="ab-heading">Fan project disclaimer</h2>
          <p>
            Isaac Arcade is an unofficial, fan-made project. It is not affiliated with,
            endorsed by, or sponsored by Edmund McMillen or Nicalis. Binding of Isaac
            artwork and names appear here solely to identify the item or boss being
            guessed, in the same spirit as a quiz or trivia site referencing a game
            it covers.
          </p>
        </section>

        <section className="ab-section">
          <h2 className="ab-heading">Contact</h2>
          <p>
            Questions, bug reports, or boss-clue corrections? Reach out at{' '}
            <a className="ab-link" href="mailto:arbershaska2@gmail.com">arbershaska2@gmail.com</a>.
          </p>
        </section>
      </div>

      <div className="ab-footer">
        <div className="ab-footer-links">
          <Link className="ab-footer-link" to="/about">About</Link>
          <Link className="ab-footer-link" to="/privacy">Privacy Policy</Link>
        </div>
        <a href="https://ko-fi.com/E1E81M8I3S" target="_blank" rel="noopener noreferrer">
          <img
            className="ab-kofi-img"
            src="https://storage.ko-fi.com/cdn/kofi5.png?v=6"
            border="0"
            alt="Buy Me a Coffee at ko-fi.com"
          />
        </a>
      </div>
    </div>
  );
}
