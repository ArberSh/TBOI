import { Link } from 'react-router-dom';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  return (
    <div className="pp-page">
      <div className="pp-card">
        <Link to="/" className="pp-back">← Back to Isaac Arcade</Link>

        <h1 className="pp-title">Privacy Policy</h1>
        <p className="pp-updated">Last updated: July 2026</p>

        <section className="pp-section">
          <h2 className="pp-heading">Overview</h2>
          <p>Isaac Arcade ("we", "the site") is a free-to-play collection of daily mini-games based on The Binding of Isaac. We take your privacy seriously. This page explains what data is collected when you visit, and how it is used.</p>
        </section>

        <section className="pp-section">
          <h2 className="pp-heading">Google AdSense &amp; Advertising</h2>
          <p>This site uses <strong>Google AdSense</strong> to display advertisements. Google AdSense may use cookies and web beacons to serve ads based on your prior visits to this site and other sites on the internet.</p>
          <p>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the internet. You may opt out of personalized advertising by visiting <a className="pp-link" href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>
        </section>

        <section className="pp-section">
          <h2 className="pp-heading">Cookies</h2>
          <p>We use the following types of cookies:</p>
          <ul className="pp-list">
            <li><strong>Game state cookies / localStorage</strong> — store your daily game progress locally in your browser. No personal information is sent to our servers.</li>
            <li><strong>Google Analytics cookies</strong> — help us understand how visitors use the site (page views, session duration). This data is aggregated and anonymous.</li>
            <li><strong>Google AdSense cookies</strong> — used by Google to deliver and personalize advertisements. These cookies may track browsing activity across sites to serve relevant ads.</li>
          </ul>
          <p>You can control or disable cookies through your browser settings. Disabling cookies may affect some site functionality and the relevance of ads shown.</p>
        </section>

        <section className="pp-section">
          <h2 className="pp-heading">Your Choices</h2>
          <p>You can opt out of personalized advertising from Google and other participating ad networks through the following links:</p>
          <ul className="pp-list">
            <li><a className="pp-link" href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a></li>
            <li><a className="pp-link" href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer">NAI Consumer Opt-Out</a></li>
            <li><a className="pp-link" href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">DAA Opt-Out</a></li>
          </ul>
        </section>

        <section className="pp-section">
          <h2 className="pp-heading">Third-Party Privacy Policies</h2>
          <p>Isaac Arcade does not control the cookies or data practices of third-party ad servers. For more information, see <a className="pp-link" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.</p>
        </section>

        <section className="pp-section">
          <h2 className="pp-heading">Children's Privacy</h2>
          <p>This site is not directed at children under the age of 13 and we do not knowingly collect personal information from children.</p>
        </section>

        <section className="pp-section">
          <h2 className="pp-heading">Contact</h2>
          <p>If you have questions about this Privacy Policy, you can reach us at <a className="pp-link" href="mailto:arbershaska2@gmail.com">arbershaska2@gmail.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
