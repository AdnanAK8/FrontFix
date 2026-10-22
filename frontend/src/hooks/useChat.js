import { useCallback, useRef, useState } from 'react';
import { BACKEND_URL } from '../config.js';
import { PRESET_SAMPLES } from '../data/presets.js';
import { sanitizeClientSide } from '../utils/sanitize.js';
import { matchOfflineKnowledge, analyzeLog } from '../utils/diagnose.js';
import { matchConversationalMessage } from '../utils/conversation.js';

const TYPING_DELAY_MS = 2000;
const MAX_SESSIONS = 12;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const TYPING_STATUSES = [
  'Searching for a match to your error...',
  'Checking the most likely cause...',
  'Putting together clear fix suggestions...',
];
const CONVERSATION_TYPING_STATUSES = ['Putting together a reply...'];

const INITIAL_SESSIONS = [
  {
    id: 'sample-cors',
    title: 'CORS policy blocked: No...',
    date: 'Oct 19',
    query: "CORS policy blocked: No 'Access-Control-Allow-Origin' header present",
    presetKey: 'cors_policy_blocked',
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let idCounter = 0;
const nextId = () => `m-${Date.now()}-${idCounter++}`;

// All chat state + actions. `online` and `showToast` are injected so this hook stays decoupled.
export default function useChat({ online, showToast, onReset }) {
  const [messages, setMessages] = useState([]);
  const [typingStatuses, setTypingStatuses] = useState(null);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [privacy, setPrivacy] = useState(true);
  const [focusSignal, setFocusSignal] = useState(0);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState(INITIAL_SESSIONS[0].id);

  // Sent to the backend with each query; a ref because it doesn't affect rendering.
  const historyRef = useRef([]);

  const chatStarted = messages.length > 0 || typingStatuses !== null;

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { id: nextId(), ...msg }]);
  }, []);

  function addHistoryEntry(titleSource, query) {
    const title = titleSource.length > 22 ? `${titleSource.slice(0, 22)}...` : titleSource;
    const session = {
      id: `session-${Date.now()}`,
      title,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      query,
      presetKey: null,
    };
    setSessions((prev) => [session, ...prev].slice(0, MAX_SESSIONS));
    setActiveSessionId(session.id);
  }

  async function send(textOverride) {
    if (sending) return;

    let query = (typeof textOverride === 'string' ? textOverride : input).trim();
    if (!query) return;
    if (privacy) query = sanitizeClientSide(query);

    addMessage({ type: 'user', text: query });
    historyRef.current.push({ role: 'user', content: query });
    addHistoryEntry(query.split('\n')[0], query);

    setInput('');
    setSending(true);
    const conversationalReply = matchConversationalMessage(query);
    setTypingStatuses(conversationalReply ? CONVERSATION_TYPING_STATUSES : TYPING_STATUSES);

    try {
      await sleep(TYPING_DELAY_MS);

      let result = null;
      if (conversationalReply) {
        result = conversationalReply;
      } else if (online) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/diagnose`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              enable_privacy: privacy,
              conversation_history: historyRef.current,
            }),
          });
          if (res.ok) result = (await res.json()).data;
        } catch (e) {
          console.warn('Backend call failed, using offline KB:', e);
        }
      }

      if (!result) result = matchOfflineKnowledge(query);

      setTypingStatuses(null);
      addMessage({ type: 'bot', data: result });
      historyRef.current.push({ role: 'assistant', content: result.title || result.problem });
    } catch {
      setTypingStatuses(null);
      addMessage({ type: 'bot', data: matchOfflineKnowledge(query) });
    } finally {
      setSending(false);
    }
  }

  function sendPreset(key) {
    send(PRESET_SAMPLES[key] || key);
  }

  async function upload(file) {
    if (file.size > MAX_FILE_BYTES) {
      alert('File exceeds maximum allowed size of 2MB.');
      return;
    }

    showToast(`Analyzing log file: ${file.name}...`);
    addMessage({
      type: 'user',
      text: `📁 Uploaded log file: ${file.name} (${Math.round(file.size / 1024)} KB)`,
    });
    setTypingStatuses(['Scanning log signatures and stack traces...']);

    const [text] = await Promise.all([file.text(), sleep(TYPING_DELAY_MS)]);

    setTypingStatuses(null);
    addMessage({ type: 'log', filename: file.name, analysis: analyzeLog(text) });
  }

  function newChat() {
    setMessages([]);
    setTypingStatuses(null);
    setInput('');
    historyRef.current = [];
    setActiveSessionId(null);
    onReset?.();
    showToast('New chat session started');
  }

  function selectSession(session) {
    setActiveSessionId(session.id);
    if (session.presetKey) {
      sendPreset(session.presetKey);
    } else if (session.query) {
      setInput(session.query);
      setFocusSignal((n) => n + 1);
    }
  }

  return {
    messages,
    typingStatuses,
    sending,
    input,
    setInput,
    privacy,
    setPrivacy,
    focusSignal,
    sessions,
    activeSessionId,
    chatStarted,
    send,
    sendPreset,
    upload,
    newChat,
    selectSession,
  };
}
