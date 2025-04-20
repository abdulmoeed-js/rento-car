
export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
  attachment_url?: string;
  is_bot?: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  last_message?: ChatMessage;
  created_at: string;
  updated_at: string;
}

export interface ChatUIProps {
  chatRoomId?: string;
  receiverId?: string;
  className?: string;
}

export interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (content: string, receiverId: string, attachmentUrl?: string) => Promise<void>;
  isSending: boolean;
  unreadCount: number;
  markAsRead: (messageIds: string[]) => Promise<void>;
  currentChatRoom: string | null;
  setChatRoom: (roomId: string | null) => void;
  chatRooms: ChatRoom[];
  createChatRoom: (participantId: string) => Promise<string>;
}
