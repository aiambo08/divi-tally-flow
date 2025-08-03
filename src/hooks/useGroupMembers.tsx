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

interface GroupInvitation {
  id: string;
  group_id: string;
  invited_email: string;
  invited_by: string;
  role: 'admin' | 'member';
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export const useGroupMembers = (groupId: string) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
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

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'pending');

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  useEffect(() => {
    if (groupId && user) {
      fetchMembers();
      fetchInvitations();
    }
  }, [groupId, user]);

  const inviteMember = async (email: string, role: 'admin' | 'member' = 'member') => {
    try {
      // Check if user already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (profile) {
        // User exists, check if already a member
        const existingMember = members.find(member => member.user_id === profile.user_id);
        if (existingMember) {
          toast({
            title: "Error",
            description: "Este usuario ya es miembro del grupo",
            variant: "destructive",
          });
          return;
        }

        // Add directly to group
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
          description: "El usuario ha sido agregado exitosamente al grupo",
        });

        fetchMembers();
      } else {
        // User doesn't exist, send invitation
        const { error } = await supabase
          .from('group_invitations')
          .insert({
            group_id: groupId,
            invited_email: email,
            invited_by: user!.id,
            role
          });

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            toast({
              title: "Error",
              description: "Ya existe una invitación pendiente para este email",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "Invitación enviada",
          description: "Se ha enviado una invitación al email proporcionado",
        });

        fetchInvitations();
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la invitación",
        variant: "destructive",
      });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('group_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitación cancelada",
        description: "La invitación ha sido cancelada",
      });

      fetchInvitations();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la invitación",
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
    invitations,
    loading,
    isAdmin,
    inviteMember,
    cancelInvitation,
    removeMember,
    changeRole,
    refetch: fetchMembers
  };
};