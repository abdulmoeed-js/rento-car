
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, ChatRoom, ChatContextType } from '@/types/chat';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Simple FAQ bot responses
const faqResponses: Record<string, string> = {
  'hello': 'Hello! How can I help you with your car rental today?',
  'help': 'I can help you with booking a car, checking your reservations, or answering questions about our policies.',
  'booking': 'To book a car, browse our available cars, select your dates, and follow the checkout process. Is there anything specific you need help with?',
  'cancel': 'You can cancel your booking from the "My Trips" section. Cancellation policies vary based on the car and timing.',
  'payment': 'We accept all major credit cards and PayPal for payments. Your payment is secure and will only be processed when the booking is confirmed.',
  'contact': 'You can contact our support team at support@rento.com or call us at 1-800-RENT-CAR.',
  'insurance': 'All rentals include basic insurance. You can add additional coverage during the checkout process.',
};

// Check if a message should trigger a bot response
const getBotResponse = (message: string): string | null => {
  const lowerMessage = message.toLowerCase();
  
  for (const [keyword, response] of Object.entries(faqResponses)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }
  
  // Default response for unrecognized queries
  if (lowerMessage.includes('?')) {
    return "I'm not sure about that. For specific questions, you might want to contact our support team.";
  }
  
  return null;
};

const ChatContext = createContext<ChatContextType>({
  messages: [],
  sendMessage: async () => {},
  isSending: false,
  unreadCount: 0,
  markAsRead: async () => {},
  currentChatRoom: null,
  setChatRoom: () => {},
  chatRooms: [],
  createChatRoom: async () => '',
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentChatRoom, setCurrentChatRoom] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  // Set current chat room
  const setChatRoom = useCallback((roomId: string | null) => {
    setCurrentChatRoom(roomId);
    if (roomId) {
      // Mark messages as read when entering a chat room
      const unreadMessages = messages
        .filter(msg => msg.receiver_id === user?.id && !msg.is_read && msg.sender_id !== 'bot')
        .map(msg => msg.id);
      
      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages);
      }
    }
  }, [messages, user?.id]);

  // Create a new chat room
  const createChatRoom = async (participantId: string): Promise<string> => {
    if (!user) throw new Error('You must be logged in to create a chat room');

    try {
      // We'll manually handle the SQL query as Supabase TypeScript doesn't know about our chat_rooms table yet
      const { data: existingRooms, error: fetchError } = await supabase
        .rpc('get_chat_room_by_participants', { 
          participant1: user.id, 
          participant2: participantId 
        });

      if (fetchError) {
        throw fetchError;
      }

      if (existingRooms && existingRooms.length > 0) {
        // Return existing room id
        return existingRooms[0].id;
      }

      // Create new chat room with a custom query
      const roomId = uuidv4();
      const { error } = await supabase
        .rpc('create_chat_room', { 
          room_id: roomId,
          user_id1: user.id,
          user_id2: participantId
        });

      if (error) {
        throw error;
      }

      return roomId;
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast.error('Failed to create chat room');
      throw error;
    }
  };

  // Send a message
  const sendMessage = async (content: string, receiverId: string, attachmentUrl?: string) => {
    if (!user) return;
    
    try {
      setIsSending(true);
      
      // Using RPC function to insert message safely
      const { data, error } = await supabase
        .rpc('insert_message', {
          sender: user.id,
          receiver: receiverId,
          msg_content: content,
          msg_timestamp: new Date().toISOString(),
          is_message_read: false,
          attachment: attachmentUrl || null
        });
      
      if (error) throw error;
      
      // Check if this is a message to the FAQ bot (receiverId === 'bot')
      if (receiverId === 'bot') {
        // Add bot response
        const botResponse = getBotResponse(content);
        if (botResponse) {
          setTimeout(async () => {
            await supabase
              .rpc('insert_message', {
                sender: 'bot',
                receiver: user.id,
                msg_content: botResponse,
                msg_timestamp: new Date().toISOString(),
                is_message_read: false,
                attachment: null,
                is_bot_message: true
              });
          }, 1000); // Simulate slight delay for more natural bot response
        }
      }
      
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Mark messages as read
  const markAsRead = async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .rpc('mark_messages_as_read', { message_ids: messageIds });
      
      if (error) throw error;
      
      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
        )
      );
      
      // Update unread count
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_unread_message_count', { user_identifier: user.id });
      
      if (error) throw error;
      
      setUnreadCount(data || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Fetch chat rooms
  const fetchChatRooms = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_user_chat_rooms', { user_identifier: user.id });
      
      if (error) throw error;
      
      setChatRooms(data || []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    }
  }, [user]);

  // Fetch messages for current chat or for a specific receiver
  const fetchMessages = useCallback(async () => {
    if (!user) return;
    
    try {
      let query;
      if (currentChatRoom) {
        // Fetch messages for a specific chat room
        query = supabase.rpc('get_chat_room_messages', { room_identifier: currentChatRoom });
      } else {
        // Fetch direct messages between user and any other user
        query = supabase.rpc('get_user_messages', { user_identifier: user.id });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user, currentChatRoom]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to messages
    const messagesSubscription = supabase
      .channel('messages_channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${user.id}` 
      }, payload => {
        const newMessage = payload.new as ChatMessage;
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        // Update unread count if the message is to the current user
        if (newMessage.receiver_id === user.id && !newMessage.is_read) {
          fetchUnreadCount();
          
          // Show notification if not in the current chat
          if (newMessage.sender_id !== 'bot') {
            toast.info(`New message from ${newMessage.sender_id}`);
          }
        }
      })
      .subscribe();
    
    // Subscribe to chat rooms
    const chatRoomsSubscription = supabase
      .channel('chat_rooms_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_rooms'
      }, () => {
        fetchChatRooms();
      })
      .subscribe();
    
    // Initial fetch
    fetchUnreadCount();
    fetchChatRooms();
    fetchMessages();
    
    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(chatRoomsSubscription);
    };
  }, [user, fetchUnreadCount, fetchChatRooms, fetchMessages]);
  
  // Refetch messages when chat room changes
  useEffect(() => {
    if (currentChatRoom) {
      fetchMessages();
    }
  }, [currentChatRoom, fetchMessages]);

  const value = {
    messages,
    sendMessage,
    isSending,
    unreadCount,
    markAsRead,
    currentChatRoom,
    setChatRoom,
    chatRooms,
    createChatRoom
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
