import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { toast } from '@/hooks/use-toast';

export default function CreateGroup() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emails: '',
  });

  // Redirect to auth if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: formData.name.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as first member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      // Process email invitations if provided
      if (formData.emails.trim()) {
        const emails = formData.emails
          .split(',')
          .map(email => email.trim())
          .filter(email => email && email.includes('@'));

        for (const email of emails) {
          // Check if user exists with this email
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', email)
            .single();

          if (existingUser) {
            // Add existing user to group
            await supabase
              .from('group_members')
              .insert({
                group_id: group.id,
                user_id: existingUser.user_id,
              });
          } else {
            // Create invitation for non-existing users
            await supabase
              .from('group_invitations')
              .insert({
                group_id: group.id,
                invited_by: user.id,
                invited_email: email,
                role: 'member',
              });
          }
        }
      }

      toast({
        title: "¡Grupo creado!",
        description: `El grupo "${group.name}" ha sido creado exitosamente.`,
      });

      navigate(`/groups/${group.id}`);
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el grupo. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="max-w-md mx-auto">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-24 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Crear Grupo</h1>
              <p className="text-muted-foreground">
                Nuevo grupo para compartir gastos
              </p>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Información del Grupo
              </CardTitle>
              <CardDescription>
                Crea un grupo para empezar a compartir gastos con tus amigos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del grupo *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="ej. Piso 2024, Viaje Barcelona..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emails">Invitar amigos (opcional)</Label>
                  <Textarea
                    id="emails"
                    placeholder="Emails separados por comas: ana@email.com, juan@email.com"
                    value={formData.emails}
                    onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Los usuarios existentes se añadirán automáticamente, los demás recibirán una invitación
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" asChild>
                    <Link to="/">Cancelar</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || !formData.name.trim()}>
                    {loading ? 'Creando...' : 'Crear Grupo'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}