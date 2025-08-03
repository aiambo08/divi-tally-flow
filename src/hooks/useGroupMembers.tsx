import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profiles?: {
    name: string;
    email: string;
    photo_url?: string;
  };
}

export const useGroupMembers = (groupId: string) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchMembers = async () => {
    try {
      const { data: membersData, error } = await supabase
        .from('group_members')
        .select('id, group_id, user_id, role, joined_at')
        .eq('group_id', groupId);

      if (error) throw error;

      // Fetch profiles separately
      const userIds = membersData?.map(member => member.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email, photo_url')
        .in('user_id', userIds);

      // Combine members with profiles
      const membersWithProfiles = membersData?.map(member => ({
        ...member,
        profiles: profiles?.find(p => p.user_id === member.user_id) || {
          name: 'Usuario',
          email: 'Sin email'
        }
      })) || [];

      setMembers(membersWithProfiles);
      
      // Check if current user is admin
      const currentUserMember = membersWithProfiles?.find(member => member.user_id === user?.id);
      setIsAdmin(currentUserMember?.role === 'admin' || false);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros del grupo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId && user) {
      fetchMembers();
    }
  }, [groupId, user]);

  const addMember = async (email: string, role: 'admin' | 'member' = 'member') => {
    try {
      // First, find the user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        toast({
          title: "Error",
          description: "No se encontró un usuario con ese email",
          variant: "destructive",
        });
        return;
      }

      // Check if user is already a member
      const existingMember = members.find(member => member.user_id === profile.user_id);
      if (existingMember) {
        toast({
          title: "Error",
          description: "Este usuario ya es miembro del grupo",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: profile.user_id,
          role
        });

      if (error) throw error;

      toast({
        title: "Miembro agregado",
        description: "El miembro ha sido agregado exitosamente al grupo",
      });

      fetchMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el miembro",
        variant: "destructive",
      });
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Miembro eliminado",
        description: "El miembro ha sido eliminado del grupo",
      });

      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el miembro",
        variant: "destructive",
      });
    }
  };

  const changeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Rol actualizado",
        description: `El rol del miembro ha sido cambiado a ${newRole === 'admin' ? 'administrador' : 'miembro'}`,
      });

      fetchMembers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el rol del miembro",
        variant: "destructive",
      });
    }
  };

  return {
    members,
    loading,
    isAdmin,
    addMember,
    removeMember,
    changeRole,
    refetch: fetchMembers
  };
};