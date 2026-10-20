import { StarIcon, DocIcon } from './Icons.jsx';

export default function Header({ online, onToggleSidebar, onNewChat }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="header-logo-icon">
          <StarIcon />
        </div>

        <div className="header-titles">
          <div className="header-title-row">
            <span className="header-title">FrontendFix AI</span>
          </div>
          <span className="header-subtitle">AI Support for JavaScript, React, CSS, HTML &amp; APIs</span>
        </div>
      </div>

      <div className="header-right">
        <div className={`status-pill-offline${online ? ' online' : ''}`} id="status-pill">
          <span className="status-indicator-dot"></span>
          <span id="status-text">{online ? 'Connected' : 'Offline Mode'}</span>
        </div>

        <div className="pill-badge-white" title="Verified local frontend diagnostics knowledge base active">
          <DocIcon />
          <span>Local Fallback</span>
        </div>

        <button className="btn-new-chat" onClick={onNewChat}>
          + New Chat
        </button>
      </div>
    </header>
  );
}
