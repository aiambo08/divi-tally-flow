import { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, DollarSign, Users, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from '@/hooks/use-toast';

interface Member {
  user_id: string;
  profiles: {
    name: string;
    email: string;
    photo_url?: string;
  };
}

export default function AddExpense() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payer_id: '',
    selectedMembers: new Set<string>(),
  });

  // Redirect to auth if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user && id) {
      fetchGroupData();
    }
  }, [user, id]);

  const fetchGroupData = async () => {
    try {
      // Fetch group info
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('name')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroupName(groupData.name);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', id);

      if (membersError) throw membersError;

      // Get profiles for each member
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name, email, photo_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const membersWithProfiles = membersData.map(member => {
          const profile = profilesData?.find(p => p.user_id === member.user_id);
          return {
            user_id: member.user_id,
            profiles: {
              name: profile?.name || 'Usuario',
              email: profile?.email || '',
              photo_url: profile?.photo_url,
            }
          };
        });

        setMembers(membersWithProfiles);
        
        // Set current user as default payer and select all members by default
        setFormData(prev => ({
          ...prev,
          payer_id: user?.id || '',
          selectedMembers: new Set(userIds),
        }));
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del grupo",
        variant: "destructive",
      });
    }
  };

  const handleMemberToggle = (userId: string) => {
    const newSelected = new Set(formData.selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setFormData({ ...formData, selectedMembers: newSelected });
  };

  const handleSelectAll = () => {
    const allUserIds = members.map(m => m.user_id);
    setFormData({ ...formData, selectedMembers: new Set(allUserIds) });
  };

  const handleSelectNone = () => {
    setFormData({ ...formData, selectedMembers: new Set() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    if (formData.selectedMembers.size === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un miembro para dividir el gasto",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      const amountPerPerson = amount / formData.selectedMembers.size;

      // Create the expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: id,
          payer_id: formData.payer_id,
          description: formData.description.trim(),
          amount: amount,
          date: formData.date,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Create expense shares for selected members
      const expenseShares = Array.from(formData.selectedMembers).map(userId => ({
        expense_id: expense.id,
        user_id: userId,
        amount_owed: amountPerPerson,
      }));

      const { error: sharesError } = await supabase
        .from('expense_shares')
        .insert(expenseShares);

      if (sharesError) throw sharesError;

      toast({
        title: "¡Gasto añadido!",
        description: `El gasto "${expense.description}" ha sido registrado exitosamente.`,
      });

      navigate(`/groups/${id}`);
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el gasto. Inténtalo de nuevo.",
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
          <div className="max-w-lg mx-auto">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-10 bg-muted rounded"></div>
                  ))}
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
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/groups/${id}`}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Añadir Gasto</h1>
              <p className="text-muted-foreground">{groupName}</p>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Nuevo Gasto
              </CardTitle>
              <CardDescription>
                Registra un gasto y divide el costo entre los miembros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción *</Label>
                    <Input
                      id="description"
                      type="text"
                      placeholder="ej. Cena en restaurante, Supermercado..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Importe (€) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer">Quién pagó *</Label>
                    <select
                      id="payer"
                      className="w-full p-2 border rounded-md bg-background"
                      value={formData.payer_id}
                      onChange={(e) => setFormData({ ...formData, payer_id: e.target.value })}
                      required
                    >
                      <option value="">Seleccionar quien pagó</option>
                      {members.map((member) => (
                        <option key={member.user_id} value={member.user_id}>
                          {member.profiles.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Members Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Dividir entre:</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        Todos
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectNone}
                      >
                        Ninguno
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {members.map((member) => (
                      <div key={member.user_id} className="flex items-center space-x-3">
                        <Checkbox
                          id={member.user_id}
                          checked={formData.selectedMembers.has(member.user_id)}
                          onCheckedChange={() => handleMemberToggle(member.user_id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.profiles.photo_url} />
                          <AvatarFallback>
                            {member.profiles.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{member.profiles.name}</p>
                          <p className="text-xs text-muted-foreground">{member.profiles.email}</p>
                        </div>
                        {formData.amount && formData.selectedMembers.has(member.user_id) && (
                          <span className="text-sm text-muted-foreground">
                            €{(parseFloat(formData.amount || '0') / formData.selectedMembers.size).toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {formData.selectedMembers.size > 0 && formData.amount && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>{formData.selectedMembers.size}</strong> persona{formData.selectedMembers.size !== 1 ? 's' : ''} seleccionada{formData.selectedMembers.size !== 1 ? 's' : ''} • 
                        <strong> €{(parseFloat(formData.amount) / formData.selectedMembers.size).toFixed(2)}</strong> por persona
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" asChild>
                    <Link to={`/groups/${id}`}>Cancelar</Link>
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={loading || !formData.description.trim() || !formData.amount || !formData.payer_id || formData.selectedMembers.size === 0}
                  >
                    {loading ? 'Guardando...' : 'Añadir Gasto'}
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