import { useState, useEffect } from "react";
import { useConversations } from "../hooks/use-conversations";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "../hooks/use-mobile";

export default function Conversations() {
  const {
    conversations,
    conversationsLoading,
    currentConversation,
    messages,
    messagesLoading,
    streamingMessage,
    wsStatus,
    createConversation,
    isCreatingConversation,
    selectConversation,
    sendMessage,
    deleteConversation,
  } = useConversations();

  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  // Toggle sidebar visibility when screen size changes
  useEffect(() => {
    setShowSidebar(!isMobile);
  }, [isMobile]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with conversation list */}
        {showSidebar && (
          <div className="w-80 border-r h-full flex-shrink-0">
            <ConversationList
              conversations={conversations || []}
              isLoading={conversationsLoading}
              onSelectConversation={selectConversation}
              onCreateConversation={(data) => createConversation(data)}
              onDeleteConversation={deleteConversation}
              isCreating={isCreatingConversation}
              selectedConversation={currentConversation}
            />
          </div>
        )}

        {/* Mobile toggle for sidebar */}
        {isMobile && (
          <button
            className="absolute top-20 left-4 z-10 p-2 bg-background border rounded-full shadow-sm"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? "×" : "≡"}
          </button>
        )}

        {/* Main chat window */}
        <div className="flex-1">
          <ChatWindow
            conversation={currentConversation}
            messages={messages || []}
            isLoading={messagesLoading}
            onSendMessage={sendMessage}
            streamingMessage={streamingMessage}
            wsStatus={wsStatus}
          />
        </div>
      </div>
    </div>
  );
}