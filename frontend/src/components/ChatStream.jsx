import { useCallback, useEffect, useRef } from 'react';
import UserMessage from './UserMessage.jsx';
import BotMessage from './BotMessage.jsx';
import LogSummary from './LogSummary.jsx';
import TypingIndicator from './TypingIndicator.jsx';

export default function ChatStream({ messages, typingStatuses, onToast }) {
  const endRef = useRef(null);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  useEffect(scrollToEnd, [messages, typingStatuses, scrollToEnd]);

  return (
    <div className="chat-stream" id="chat-stream" style={{ display: 'flex' }}>
      {messages.map((m) => {
        if (m.type === 'user') return <UserMessage key={m.id} text={m.text} />;
        if (m.type === 'log')
          return <LogSummary key={m.id} filename={m.filename} analysis={m.analysis} onReveal={scrollToEnd} />;
        return <BotMessage key={m.id} data={m.data} onToast={onToast} onReveal={scrollToEnd} />;
      })}
      {typingStatuses && <TypingIndicator statuses={typingStatuses} />}
      <div ref={endRef} />
    </div>
  );
}
