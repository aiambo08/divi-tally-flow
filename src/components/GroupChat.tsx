import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MessageCircle, Send, MoreVertical, Reply, Trash2, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGroupChat } from '@/hooks/useGroupChat';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

export const GroupChat: React.FC<GroupChatProps> = ({ groupId, groupName }) => {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, deleteMessage } = useGroupChat(groupId);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; message: string; userName: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    await sendMessage(newMessage, replyTo?.id);
    setNewMessage('');
    setReplyTo(null);
  };

  const handleReply = (messageId: string, message: string, userName: string) => {
    setReplyTo({ id: messageId, message, userName });
  };

  const handleDelete = async (messageId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      await deleteMessage(messageId);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: es 
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat del Grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat: {groupName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay mensajes aún.</p>
                <p className="text-sm">¡Sé el primero en escribir algo!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="group relative">
                  {/* Reply indicator */}
                  {message.reply_to_id && (
                    <div className="ml-12 mb-1 text-xs text-muted-foreground border-l-2 border-muted pl-2">
                      Respondiendo a un mensaje anterior
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.profiles?.photo_url} />
                      <AvatarFallback>
                        {message.profiles?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.profiles?.name || 'Usuario'}
                        </span>
                        {message.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">Tú</Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                      
                      <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                        {message.message}
                      </div>
                    </div>
                    
                    {/* Message Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleReply(
                              message.id, 
                              message.message, 
                              message.profiles?.name || 'Usuario'
                            )}
                          >
                            <Reply className="h-4 w-4 mr-2" />
                            Responder
                          </DropdownMenuItem>
                          {message.user_id === user?.id && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(message.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Reply Preview */}
        {replyTo && (
          <div className="px-4 py-2 bg-muted border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Respondiendo a </span>
                <span className="font-medium">{replyTo.userName}</span>
                <div className="text-xs text-muted-foreground truncate max-w-xs">
                  {replyTo.message}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}
        
        {/* Message Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};