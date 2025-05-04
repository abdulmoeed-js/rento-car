
import React, { createContext, useContext, useState } from 'react';
import { ChatMessage, ChatRoom, ChatContextType } from '@/types/chat';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Initial context value with all required properties
const ChatContext = createContext<ChatContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  messages: [],
  sendMessage: async () => {},
  isSending: false,
  markAsRead: async () => {},
  currentChatRoom: null,
  setChatRoom: () => {},
  chatRooms: [],
  createChatRoom: async () => "",
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [currentChatRoom, setCurrentChatRoom] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  
  const { user } = useAuth();

  // Send a message function
  const sendMessage = async (content: string, receiverId: string, attachmentUrl?: string) => {
    if (!user) {
      toast.error("You must be logged in to send messages");
      return;
    }
    
    try {
      setIsSending(true);
      const newMessage: ChatMessage = {
        id: uuidv4(),
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        timestamp: new Date().toISOString(),
        is_read: false,
        attachment_url: attachmentUrl
      };

      // For demo purposes, we're just storing messages in state
      // In a real app, you would save to the database
      setMessages(prev => [...prev, newMessage]);

      // Simulate a response from bot if receiver is 'bot'
      if (receiverId === 'bot') {
        setTimeout(() => {
          const botResponse: ChatMessage = {
            id: uuidv4(),
            sender_id: 'bot',
            receiver_id: user.id,
            content: `Thank you for your message! This is an automated response to "${content}"`,
            timestamp: new Date().toISOString(),
            is_read: false,
            is_bot: true
          };
          setMessages(prev => [...prev, botResponse]);
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Mark messages as read
  const markAsRead = async (messageIds: string[]) => {
    if (!messageIds.length) return;
    
    try {
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
        )
      );

      // Update unread count
      const remainingUnread = messages.filter(
        msg => !msg.is_read && !messageIds.includes(msg.id) && msg.receiver_id === user?.id
      ).length;
      
      setUnreadCount(remainingUnread);
      
      // In a real app, you would also update the database
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  // Create a new chat room
  const createChatRoom = async (participantId: string): Promise<string> => {
    if (!user) {
      toast.error("You must be logged in to create chat rooms");
      return "";
    }
    
    try {
      const roomId = uuidv4();
      const newRoom: ChatRoom = {
        id: roomId,
        participants: [user.id, participantId],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Update local state
      setChatRooms(prev => [...prev, newRoom]);
      
      // In a real app, you would save to the database
      
      return roomId;
    } catch (error) {
      console.error("Failed to create chat room:", error);
      toast.error("Failed to create chat room");
      return "";
    }
  };

  // Set current chat room
  const setChatRoom = (roomId: string | null) => {
    setCurrentChatRoom(roomId);
  };

  return (
    <ChatContext.Provider value={{ 
      unreadCount, 
      setUnreadCount,
      messages,
      sendMessage,
      isSending,
      markAsRead,
      currentChatRoom,
      setChatRoom,
      chatRooms,
      createChatRoom
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
