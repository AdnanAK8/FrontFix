import { CardIcon } from './Icons.jsx';

export default function SuggestionCard({ suggestion, onClick }) {
  return (
    <button className="suggestion-card" onClick={() => onClick(suggestion.key)}>
      <div className={`card-icon-wrap ${suggestion.iconClass}`}>
        <CardIcon name={suggestion.icon} />
      </div>
      <div className="card-content">
        <span className="card-tag">{suggestion.tag}</span>
        <span className="card-title">{suggestion.title}</span>
      </div>
    </button>
  );
}
