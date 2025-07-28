import { useState, useEffect } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Users, DollarSign, Calendar, User } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from '@/hooks/use-toast';

interface GroupData {
  id: string;
  name: string;
  created_at: string;
}

interface Member {
  user_id: string;
  profiles: {
    name: string;
    email: string;
    photo_url?: string;
  };
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  payer_id: string;
  is_settled: boolean;
  payer_profile: {
    name: string;
  };
}

interface Balance {
  user_id: string;
  name: string;
  balance: number;
}

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select('id, name, created_at')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Fetch members with their profiles
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
      }

      // Fetch expenses with payer info
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('id, description, amount, date, payer_id, is_settled')
        .eq('group_id', id)
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      // Get payer profiles
      if (expensesData && expensesData.length > 0) {
        const payerIds = [...new Set(expensesData.map(e => e.payer_id))];
        const { data: payerProfiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', payerIds);

        const expensesWithPayers = expensesData.map(expense => ({
          ...expense,
          payer_profile: {
            name: payerProfiles?.find(p => p.user_id === expense.payer_id)?.name || 'Usuario'
          }
        }));

        setExpenses(expensesWithPayers);
      } else {
        setExpenses([]);
      }

      // Calculate balances
      await calculateBalances();

    } catch (error) {
      console.error('Error fetching group data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del grupo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateBalances = async () => {
    try {
      // Get all expense shares for this group
      const { data: shares } = await supabase
        .from('expense_shares')
        .select(`
          amount_owed,
          user_id,
          expenses!inner(group_id)
        `)
        .eq('expenses.group_id', id);

      // Get all expenses paid by users in this group
      const { data: paidExpenses } = await supabase
        .from('expenses')
        .select('amount, payer_id')
        .eq('group_id', id);

      // Calculate net balance for each member
      const balanceMap = new Map<string, { name: string, balance: number }>();

      // Initialize balances for all members
      members.forEach(member => {
        balanceMap.set(member.user_id, {
          name: member.profiles.name,
          balance: 0
        });
      });

      // Subtract what each user owes
      shares?.forEach(share => {
        const current = balanceMap.get(share.user_id);
        if (current) {
          current.balance -= Number(share.amount_owed);
        }
      });

      // Add what each user paid
      paidExpenses?.forEach(expense => {
        const current = balanceMap.get(expense.payer_id);
        if (current) {
          current.balance += Number(expense.amount);
        }
      });

      const balancesArray = Array.from(balanceMap.entries()).map(([user_id, data]) => ({
        user_id,
        name: data.name,
        balance: data.balance
      }));

      setBalances(balancesArray);
    } catch (error) {
      console.error('Error calculating balances:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!group) {
    return (
      <Layout>
        <div className="container mx-auto py-8 text-center">
          <h1 className="text-2xl font-bold">Grupo no encontrado</h1>
          <Button asChild className="mt-4">
            <Link to="/">Volver a grupos</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Creado {new Date(group.created_at).toLocaleDateString()}
            </p>
          </div>
          <Button asChild>
            <Link to={`/groups/${id}/expenses/new`}>
              <Plus className="w-4 h-4 mr-2" />
              Añadir Gasto
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Gastos Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay gastos aún</h3>
                    <p className="text-muted-foreground mb-4">
                      Añade el primer gasto para empezar a dividir costos
                    </p>
                    <Button asChild>
                      <Link to={`/groups/${id}/expenses/new`}>
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir primer gasto
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{expense.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            Pagado por {expense.payer_profile?.name} • {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{Number(expense.amount).toFixed(2)}</p>
                          <Badge variant={expense.is_settled ? "default" : "secondary"}>
                            {expense.is_settled ? "Liquidado" : "Pendiente"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Miembros ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-3">
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {balances.map((balance) => (
                    <div key={balance.user_id} className="flex items-center justify-between">
                      <span className="font-medium text-sm">{balance.name}</span>
                      <Badge variant={balance.balance >= 0 ? "default" : "destructive"}>
                        {balance.balance >= 0 ? '+' : ''}€{balance.balance.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}