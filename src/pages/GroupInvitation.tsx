import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Clock, CheckCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from '@/hooks/use-toast';

interface GroupInvitation {
  id: string;
  group_id: string;
  invited_email: string;
  role: 'admin' | 'member';
  status: string;
  expires_at: string;
  created_at: string;
  groups: {
    name: string;
    created_at: string;
  };
  profiles: {
    name: string;
  };
}

export default function GroupInvitation() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<GroupInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data: invitationData, error } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (error) throw error;

      // Check if invitation is expired
      if (new Date(invitationData.expires_at) < new Date()) {
        toast({
          title: "Invitación expirada",
          description: "Esta invitación ha expirado",
          variant: "destructive",
        });
        return;
      }

      // Fetch group details
      const { data: groupData } = await supabase
        .from('groups')
        .select('name, created_at')
        .eq('id', invitationData.group_id)
        .single();

      // Fetch inviter profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', invitationData.invited_by)
        .single();

      setInvitation({
        ...invitationData,
        groups: groupData || { name: 'Grupo desconocido', created_at: '' },
        profiles: profileData || { name: 'Usuario desconocido' }
      });
    } catch (error) {
      console.error('Error fetching invitation:', error);
      toast({
        title: "Error",
        description: "No se pudo encontrar la invitación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!user || !invitation) return;

    setAccepting(true);
    try {
      // Add user to group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: invitation.group_id,
          user_id: user.id,
          role: invitation.role
        });

      if (memberError) throw memberError;

      // Mark invitation as accepted
      const { error: invitationError } = await supabase
        .from('group_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (invitationError) throw invitationError;

      toast({
        title: "¡Invitación aceptada!",
        description: `Te has unido al grupo "${invitation.groups.name}"`,
      });

      navigate(`/groups/${invitation.group_id}`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "No se pudo aceptar la invitación",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!invitation) {
    return (
      <Layout>
        <div className="container mx-auto py-8 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Invitación no encontrada</CardTitle>
              <CardDescription className="text-center">
                Esta invitación no existe o ha expirado
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link to="/">Ir al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Check if user is already a member
  if (user) {
    return (
      <Layout>
        <div className="container mx-auto py-8 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Invitación al Grupo
              </CardTitle>
              <CardDescription>
                Has sido invitado a unirte al grupo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{invitation.groups.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Creado el {new Date(invitation.groups.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Rol asignado:</span>
                  <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
                    {invitation.role === 'admin' && <Crown className="h-3 w-3" />}
                    {invitation.role === 'admin' ? 'Administrador' : 'Miembro'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Invitado por:</span>
                  <span className="font-medium">{invitation.profiles?.name || 'Usuario'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Válida hasta:</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={acceptInvitation} 
                  disabled={accepting}
                  className="w-full"
                >
                  {accepting ? (
                    "Aceptando..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aceptar invitación
                    </>
                  )}
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Rechazar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // User not logged in
  return (
    <Layout>
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Invitación al Grupo
            </CardTitle>
            <CardDescription>
              Necesitas una cuenta para unirte al grupo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{invitation.groups.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Has sido invitado a unirte a este grupo
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Rol asignado:</span>
                <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
                  {invitation.role === 'admin' && <Crown className="h-3 w-3" />}
                  {invitation.role === 'admin' ? 'Administrador' : 'Miembro'}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to={`/auth?invitation=${token}`}>
                  Crear cuenta y unirse
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link to={`/auth?invitation=${token}&mode=signin`}>
                  Ya tengo cuenta
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}