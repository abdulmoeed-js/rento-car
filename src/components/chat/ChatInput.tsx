
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Image, Smile } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface ChatInputProps {
  receiverId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ receiverId }) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isSending } = useChat();
  
  const handleSend = async () => {
    if (!message.trim() && !fileInputRef.current?.files?.length) {
      return;
    }
    
    try {
      await sendMessage(message, receiverId);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }
    
    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const filePath = `chat-attachments/${uuidv4()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;
      
      // Send message with attachment
      await sendMessage(
        file.type.startsWith('image/') 
          ? '📷 Image' 
          : `📎 Attachment: ${file.name}`,
        receiverId,
        publicUrl
      );
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="border-t p-3">
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[60px] resize-none"
          disabled={isSending || isUploading}
        />
        
        <div className="flex flex-col gap-2">
          {/* File attachment button */}
          <Button 
            variant="outline" 
            size="icon" 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isUploading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          {/* Send button */}
          <Button 
            variant="default" 
            size="icon" 
            onClick={handleSend}
            disabled={(!message.trim() && !fileInputRef.current?.files?.length) || isSending || isUploading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input 
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
};

export default ChatInput;
