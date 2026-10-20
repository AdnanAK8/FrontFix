import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import HeroView from './components/HeroView.jsx';
import ChatStream from './components/ChatStream.jsx';
import InputDock from './components/InputDock.jsx';
import Toast from './components/Toast.jsx';
import useBackendStatus from './hooks/useBackendStatus.js';
import useToast from './hooks/useToast.js';
import useSidebar from './hooks/useSidebar.js';
import useChat from './hooks/useChat.js';

export default function App() {
  const online = useBackendStatus();
  const { toast, showToast } = useToast();
  const sidebar = useSidebar();
  const chat = useChat({ online, showToast, onReset: sidebar.closeMobile });

  return (
    <div className="app-layout">
      <Sidebar
        sessions={chat.sessions}
        activeId={chat.activeSessionId}
        collapsed={sidebar.collapsed}
        mobileOpen={sidebar.mobileOpen}
        onNewChat={chat.newChat}
        onSelect={chat.selectSession}
      />

      <div className="main-wrapper">
        <Header online={online} onToggleSidebar={sidebar.toggle} onNewChat={chat.newChat} />

        <main className="chat-viewport" id="chat-viewport">
          {chat.chatStarted ? (
            <ChatStream
              messages={chat.messages}
              typingStatuses={chat.typingStatuses}
              onToast={showToast}
            />
          ) : (
            <HeroView onPreset={chat.sendPreset} />
          )}
        </main>

        <InputDock
          value={chat.input}
          onChange={chat.setInput}
          onSend={chat.send}
          onUpload={chat.upload}
          disabled={chat.sending}
          privacy={chat.privacy}
          onPrivacyChange={chat.setPrivacy}
          focusSignal={chat.focusSignal}
        />
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
