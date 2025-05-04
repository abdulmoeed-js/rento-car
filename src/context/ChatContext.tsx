
import React, { createContext, useContext, useState } from 'react';

type ChatContextType = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
};

const ChatContext = createContext<ChatContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <ChatContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
