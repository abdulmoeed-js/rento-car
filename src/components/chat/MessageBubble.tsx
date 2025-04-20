
import React from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/chat';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileIcon, ImageIcon } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { user } = useAuth();
  const isCurrentUser = message.sender_id === user?.id;
  const isBot = message.sender_id === 'bot';
  
  const hasAttachment = !!message.attachment_url;
  const isImageAttachment = hasAttachment && 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(message.attachment_url || '');
  
  const formattedTime = message.timestamp 
    ? format(new Date(message.timestamp), 'h:mm a')
    : '';
  
  return (
    <div className={cn(
      "flex items-start gap-2 mb-4",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback className={cn(
          isBot ? "bg-indigo-100 text-indigo-600" : 
          isCurrentUser ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
        )}>
          {isBot ? 'BOT' : message.sender_id.substring(0, 2).toUpperCase()}
        </AvatarFallback>
        <AvatarImage src="" />
      </Avatar>
      
      <div className={cn(
        "rounded-lg p-3 max-w-[80%]",
        isCurrentUser 
          ? "bg-blue-500 text-white rounded-tr-none" 
          : isBot 
            ? "bg-indigo-100 text-slate-800 rounded-tl-none"
            : "bg-gray-100 text-slate-800 rounded-tl-none"
      )}>
        {/* Message content */}
        <div className="mb-1">{message.content}</div>
        
        {/* Attachment preview */}
        {hasAttachment && (
          <div className="mt-2">
            {isImageAttachment ? (
              <img 
                src={message.attachment_url} 
                alt="Attachment" 
                className="rounded-md max-h-40 object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 bg-white/20 rounded p-2">
                <FileIcon className="h-4 w-4" />
                <span className="text-sm truncate">Attachment</span>
              </div>
            )}
          </div>
        )}
        
        {/* Timestamp */}
        <div className={cn(
          "text-xs mt-1",
          isCurrentUser ? "text-blue-100" : "text-slate-500"
        )}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
