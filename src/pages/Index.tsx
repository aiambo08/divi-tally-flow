import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, DollarSign, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';

interface Group {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
  total_expenses: number;
  user_balance: number;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      // Get groups where user is a member
      const { data: groupMemberships, error: membershipError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups!inner (
            id,
            name,
            created_at
          )
        `)
        .eq('user_id', user?.id);

      if (membershipError) throw membershipError;

      // For each group, get member count, total expenses, and user balance
      const groupsWithData = await Promise.all(
        (groupMemberships || []).map(async (membership: any) => {
          const groupId = membership.groups.id;
          
          // Get member count
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', groupId);

          // Get total expenses (sum of all expenses in group)
          const { data: expensesSum } = await supabase
            .from('expenses')
            .select('amount')
            .eq('group_id', groupId);

          const totalExpenses = expensesSum?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

          // Get user balance (what user owes or is owed)
          const { data: userShares } = await supabase
            .from('expense_shares')
            .select('amount_owed, expenses!inner(payer_id)')
            .eq('user_id', user?.id)
            .eq('expenses.group_id', groupId);

          const { data: userPaidExpenses } = await supabase
            .from('expenses')
            .select('amount')
            .eq('group_id', groupId)
            .eq('payer_id', user?.id);

          const totalOwed = userShares?.reduce((sum, share) => sum + Number(share.amount_owed), 0) || 0;
          const totalPaid = userPaidExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
          const userBalance = totalPaid - totalOwed;

          return {
            id: groupId,
            name: membership.groups.name,
            created_at: membership.groups.created_at,
            member_count: memberCount || 0,
            total_expenses: totalExpenses,
            user_balance: userBalance,
          };
        })
      );

      setGroups(groupsWithData);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  // Redirect to auth if not authenticated - moved after all hooks
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Grupos</h1>
            <p className="text-muted-foreground">
              Administra tus gastos compartidos
            </p>
          </div>
          <Button asChild>
            <Link to="/groups/new">
              <Plus className="w-4 h-4 mr-2" />
              Crear Grupo
            </Link>
          </Button>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No tienes grupos aún</h3>
                  <p className="text-muted-foreground max-w-md">
                    Crea tu primer grupo para empezar a compartir gastos con amigos, 
                    compañeros de piso o en tus viajes.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/groups/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear mi primer grupo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <Link to={`/groups/${group.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{group.name}</span>
                      <Badge variant={group.user_balance >= 0 ? "default" : "destructive"}>
                        {group.user_balance >= 0 ? '+' : ''}€{group.user_balance.toFixed(2)}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Creado {new Date(group.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {group.member_count} miembro{group.member_count !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        €{group.total_expenses.toFixed(2)} total
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
