import StreamLine from './StreamLine.jsx';
import EvidenceBox from './EvidenceBox.jsx';
import DiffBlock from './DiffBlock.jsx';
import FeedbackBar from './FeedbackBar.jsx';

export default function BotMessage({ data, onToast, onReveal }) {
  if (data.conversational) {
    return (
      <div className="chat-bubble-bot conversational-reply">
        <div className="conversation-avatar" aria-hidden="true">✦</div>
        <div className="conversation-copy">
          <div className="conversation-title">{data.title}</div>
          <p>{data.problem}</p>
        </div>
      </div>
    );
  }

  // Build the list of rows first so each gets a sequential reveal index.
  const rows = [];

  rows.push(
    <div className="bot-header">
      <span className="category-tag">{data.category || 'Frontend Support'}</span>
      <span className="provenance-tag ai-gen">✨ Verified Frontend Diagnostic</span>
    </div>
  );

  if (data.evidence_summary) rows.push(<EvidenceBox evidence={data.evidence_summary} />);

  rows.push(<div className="bot-title">{data.title}</div>);

  rows.push(
    <div className="section-block">
      <div className="section-label">🔍 Problem</div>
      <div className="section-content">{data.problem || ''}</div>
    </div>
  );

  rows.push(
    <div className="section-block">
      <div className="section-label">⚡ Likely Cause</div>
      <div className="section-content">{data.likely_cause || ''}</div>
    </div>
  );

  if (data.follow_up_question) {
    rows.push(
      <div className="followup-callout">
        <span className="followup-icon">💡</span>
        <div>
          <strong>Missing Detail for Exact Fix:</strong>
          <p>{data.follow_up_question}</p>
        </div>
      </div>
    );
  }

  if (Array.isArray(data.fix_steps) && data.fix_steps.length > 0) {
    rows.push(
      <div className="section-block">
        <div className="section-label">🛠️ Fix Steps</div>
        <div className="fix-steps-list">
          {data.fix_steps.map((step, idx) => (
            <div className="fix-step-item" key={idx}>
              <span className="fix-step-num">Step {idx + 1}</span>
              <span>{step.replace(/^\d+\.\s*/, '')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.code_before && data.code_after) {
    rows.push(
      <DiffBlock
        fileHint={data.file_hint}
        note={data.code_context_note}
        before={data.code_before}
        after={data.code_after}
        onCopy={onToast}
      />
    );
  }

  rows.push(
    <div className="extra-tips-card">
      <strong>💡 Pro Tip:</strong>{' '}
      {data.extra_tips || 'Always verify with the official documentation linked below.'}
    </div>
  );

  if (data.source) {
    rows.push(
      <div className="bot-source">
        <span>Documentation Source:</span>
        <a href={data.source.url} target="_blank" rel="noopener noreferrer">
          {data.source.title} →
        </a>
      </div>
    );
  }

  rows.push(
    <FeedbackBar
      prompt={data.confirmation_prompt}
      onSubmit={() => onToast('Feedback submitted. Thank you!')}
    />
  );

  return (
    <div className="chat-bubble-bot">
      {rows.map((row, i) => (
        <StreamLine key={i} index={i} onReveal={onReveal}>
          {row}
        </StreamLine>
      ))}
    </div>
  );
}
