
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { ChatUIProps } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { MessagesSquare } from 'lucide-react';

const Chat: React.FC<ChatUIProps> = ({ chatRoomId, receiverId, className }) => {
  const { messages, currentChatRoom, setChatRoom } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Set chat room when component mounts if chatRoomId is provided
  useEffect(() => {
    if (chatRoomId) {
      setChatRoom(chatRoomId);
    }
  }, [chatRoomId, setChatRoom]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // If no chat room is selected and no receiverId is provided
  if (!currentChatRoom && !receiverId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MessagesSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No conversation selected</h3>
        <p className="text-muted-foreground mt-2">
          Choose a conversation from the sidebar or start a new one
        </p>
      </div>
    );
  }
  
  // Filter messages for the current conversation
  const filteredMessages = messages.filter(msg => 
    (msg.sender_id === user?.id && msg.receiver_id === receiverId) ||
    (msg.sender_id === receiverId && msg.receiver_id === user?.id) ||
    (receiverId === 'bot' && msg.sender_id === 'bot' && msg.receiver_id === user?.id)
  );
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat header */}
      <div className="flex items-center p-3 border-b">
        <h3 className="font-medium">
          {receiverId === 'bot' ? 'Rento Assistant' : 'Chat'}
        </h3>
      </div>
      
      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {filteredMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </ScrollArea>
      
      {/* Chat input */}
      <ChatInput receiverId={receiverId || 'bot'} />
    </div>
  );
};

export default Chat;
