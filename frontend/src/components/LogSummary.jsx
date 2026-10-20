import StreamLine from './StreamLine.jsx';

export default function LogSummary({ filename, analysis, onReveal }) {
  const { top_issues: issues } = analysis;

  return (
    <div className="chat-bubble-bot">
      <StreamLine index={0} onReveal={onReveal}>
        <div className="bot-header">
          <span className="category-tag">Log File Analysis</span>
          <span style={{ fontSize: 11, color: '#78998c' }}>{filename}</span>
        </div>
      </StreamLine>

      <StreamLine index={1} onReveal={onReveal}>
        <div className="bot-title">Diagnostic Log Summary</div>
      </StreamLine>

      <StreamLine index={2} onReveal={onReveal}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <span style={pill}>Lines: {analysis.total_lines_analyzed}</span>
          <span style={pill}>Errors Flagged: {analysis.total_error_lines_detected}</span>
        </div>
      </StreamLine>

      <StreamLine index={3} style={{ marginTop: 6 }} onReveal={onReveal}>
        <div className="section-label">Identified Error Signatures &amp; Actionable Fixes:</div>
        {issues.length > 0 ? (
          issues.map((iss) => (
            <div key={iss.diagnosis.id} style={issueBox}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#2d705c' }}>
                {iss.diagnosis.title || iss.symptom}
              </div>
              <div style={{ fontSize: 12, color: '#537568', marginTop: 4 }}>
                <strong>Likely Cause:</strong> {iss.diagnosis.likely_cause}
              </div>
              <div style={{ fontSize: 12, color: '#183e32', marginTop: 6 }}>
                <strong>Fix:</strong> {iss.diagnosis.fix_steps?.[0] ?? 'Review documentation'}
              </div>
            </div>
          ))
        ) : (
          <p style={{ fontSize: 13, color: '#537568' }}>
            No known critical exceptions detected in this log snippet.
          </p>
        )}
      </StreamLine>
    </div>
  );
}

const pill = {
  fontSize: 11,
  padding: '4px 10px',
  background: '#e8f5ec',
  borderRadius: 6,
  fontWeight: 600,
  color: '#1e6952',
};

const issueBox = {
  background: '#f9fcf9',
  border: '1px solid #d4ebd9',
  padding: 12,
  borderRadius: 8,
  borderLeft: '3px solid #2d705c',
  marginTop: 8,
};
