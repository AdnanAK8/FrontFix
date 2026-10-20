import { useState } from 'react';

export default function FeedbackBar({ prompt, onSubmit }) {
  const [answer, setAnswer] = useState(null); // null | true | false

  function choose(helpful) {
    setAnswer(helpful);
    onSubmit?.(helpful);
  }

  if (answer !== null) {
    return (
      <div className="feedback-bar">
        <span style={{ color: '#2d705c', fontWeight: 600, fontSize: 11 }}>
          {answer ? '✨ Glad this resolved your issue!' : '🙏 Thank you for the feedback.'}
        </span>
      </div>
    );
  }

  return (
    <div className="feedback-bar">
      <span>{prompt || 'Did this resolve your issue?'}</span>
      <div className="feedback-actions">
        <button className="feedback-btn" onClick={() => choose(true)}>
          👍 Yes, helped!
        </button>
        <button className="feedback-btn" onClick={() => choose(false)}>
          👎 Needs work
        </button>
      </div>
    </div>
  );
}
