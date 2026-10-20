import { StarIcon } from './Icons.jsx';

export default function Sidebar({ sessions, activeId, collapsed, mobileOpen, onNewChat, onSelect }) {
  const cls = ['sidebar', collapsed ? 'collapsed' : '', mobileOpen ? 'mobile-open' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={cls} id="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <StarIcon />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">FrontendFix AI</span>
            <span className="sidebar-brand-sub">HISTORY</span>
          </div>
        </div>

        <button className="new-session-btn" onClick={onNewChat}>
          <span>+ New Chat Session</span>
        </button>
      </div>

      <div className="sidebar-history" id="sidebar-history">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`history-item${s.id === activeId ? ' active' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`Load recent issue: ${s.title}`}
            onClick={() => onSelect(s)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(s);
              }
            }}
          >
            <div className="history-item-left">
              <span className="history-icon">💬</span>
              <span className="history-title">{s.title}</span>
            </div>
            <span className="history-date">{s.date}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <span>Team B: Class Project</span>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
}
