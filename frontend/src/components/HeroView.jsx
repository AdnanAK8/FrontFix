import { BotIcon } from './Icons.jsx';
import SuggestionCard from './SuggestionCard.jsx';
import { SUGGESTIONS } from '../data/presets.js';

export default function HeroView({ onPreset }) {
  return (
    <div className="hero-view" id="hero-view">
      <div className="hero-avatar">
        <BotIcon />
      </div>

      <h1 className="hero-main-title">FrontendFix AI</h1>

      <p className="hero-description">
        Share the error or tell me what feels broken. I’ll help you find the likely cause and walk you
        through a fix, one step at a time.
      </p>

      <div className="hero-section-label">TRY ONE OF THESE REAL FRONTEND ISSUES:</div>

      <div className="suggestions-grid">
        {SUGGESTIONS.map((s) => (
          <SuggestionCard key={s.key} suggestion={s} onClick={onPreset} />
        ))}
      </div>
    </div>
  );
}
