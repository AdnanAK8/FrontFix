import { useEffect, useRef } from 'react';
import { UploadIcon, SendIcon } from './Icons.jsx';

export default function InputDock({
  value,
  onChange,
  onSend,
  onUpload,
  disabled,
  privacy,
  onPrivacyChange,
  focusSignal,
}) {
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  // Auto-grow up to 120px
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  // Let the parent ask for focus (e.g. after loading a history item)
  useEffect(() => {
    if (focusSignal) textareaRef.current?.focus();
  }, [focusSignal]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  }

  return (
    <footer className="input-dock-wrapper">
      <div className="input-dock-card">
        <div className="input-dock-main">
          <button
            className="dock-upload-btn"
            onClick={() => fileRef.current?.click()}
            title="Attach error log or file snippet"
            aria-label="Upload log file"
          >
            <UploadIcon />
          </button>

          <textarea
            ref={textareaRef}
            id="prompt-input"
            className="dock-textarea"
            rows={1}
            placeholder="Paste an error, stack trace, or describe what’s going wrong..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            id="send-btn"
            className="dock-send-btn"
            onClick={() => onSend()}
            disabled={disabled}
            aria-label="Send query"
          >
            <SendIcon />
          </button>
        </div>

        <div className="input-dock-footer">
          <label className="dock-privacy">
            <input type="checkbox" checked={privacy} onChange={(e) => onPrivacyChange(e.target.checked)} />
            <span>Privacy shield on</span>
          </label>
          <span className="dock-warning">Don’t include passwords, API keys, or customer data.</span>
          <span className="dock-shortcut">
            Press <kbd>Enter</kbd> to send
          </span>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        style={{ display: 'none' }}
        accept=".log,.txt,.json"
        onChange={handleFile}
      />
    </footer>
  );
}
