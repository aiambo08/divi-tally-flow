import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  message: string;
  message_type: string;
  reply_to_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    photo_url?: string;
  };
}

export const useGroupChat = (groupId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Cargar mensajes iniciales
  useEffect(() => {
    if (groupId && user) {
      fetchMessages();
    }
  }, [groupId, user]);

  // Configurar tiempo real
  useEffect(() => {
    if (!groupId || !user) return;

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          const newMessage = payload.new as GroupMessage;
          
          // Obtener información del perfil del usuario
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, photo_url')
            .eq('user_id', newMessage.user_id)
            .single();

          setMessages(prev => [...prev, {
            ...newMessage,
            profiles: profile || { name: 'Usuario' }
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          id,
          group_id,
          user_id,
          message,
          message_type,
          reply_to_id,
          created_at,
          updated_at
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Obtener perfiles de usuarios por separado
      const userIds = [...new Set(data?.map(msg => msg.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, photo_url')
        .in('user_id', userIds);

      // Combinar mensajes con perfiles
      const messagesWithProfiles = data?.map(message => ({
        ...message,
        profiles: profiles?.find(p => p.user_id === message.user_id) || { name: 'Usuario' }
      })) || [];

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string, replyToId?: string) => {
    if (!user || !message.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          message: message.trim(),
          reply_to_id: replyToId || null
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Mensaje eliminado",
        description: "El mensaje ha sido eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el mensaje",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    loading,
    sending,
    sendMessage,
    deleteMessage,
    refetch: fetchMessages
  };
};