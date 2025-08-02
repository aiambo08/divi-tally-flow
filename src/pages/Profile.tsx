import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.name || '');

  const userInitials = user?.user_metadata?.name
    ? user.user_metadata.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: displayName }
      });

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada correctamente.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-muted-foreground">
              Gestiona tu información personal y preferencias de cuenta.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Tu información básica de perfil en DiviDINERO.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-medium">{user?.user_metadata?.name || 'Usuario'}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    El correo electrónico no se puede modificar.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      Editar Perfil
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleUpdateProfile}>
                        Guardar Cambios
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setDisplayName(user?.user_metadata?.name || '');
                        }}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información de Cuenta</CardTitle>
              <CardDescription>
                Detalles técnicos de tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Usuario desde</p>
                  <p className="text-muted-foreground">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Último acceso</p>
                  <p className="text-muted-foreground">
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}