export default function DiffBlock({ fileHint, note, before, after, onCopy }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(after);
      onCopy?.('Code fix copied to clipboard!');
    } catch {
      onCopy?.('Code copied!');
    }
  }

  return (
    <div className="diff-container">
      <div className="diff-header">
        <span>{fileHint || 'Code Fix'}</span>
        <button className="copy-btn" onClick={copy}>
          Copy Fix
        </button>
      </div>
      {note && <div className="code-context-note">{note}</div>}
      <div className="diff-body">
        <div className="diff-line-del">{before}</div>
        <div className="diff-line-add">{after}</div>
      </div>
    </div>
  );
}
