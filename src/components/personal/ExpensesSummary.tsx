import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePersonalExpenses, PersonalExpense } from '@/hooks/usePersonalExpenses';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExpensesSummaryProps {
  currentMonth: number;
  currentYear: number;
}

export const ExpensesSummary = ({ currentMonth, currentYear }: ExpensesSummaryProps) => {
  const { expenses, loading, fetchExpenses, deleteExpense } = usePersonalExpenses();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchExpenses(currentYear, currentMonth);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    const monthTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    setTotal(monthTotal);
  }, [expenses]);

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      await deleteExpense(expenseId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Cargando gastos...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Total */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Total del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              €{total.toFixed(2)}
            </div>
            <p className="text-muted-foreground mt-2">
              {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'} registrados
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay gastos registrados para este mes
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: expense.category?.color }}
                    />
                    <div>
                      <div className="font-medium">{expense.description || 'Sin descripción'}</div>
                      <div className="text-sm text-muted-foreground">
                        {expense.category?.name} • {format(new Date(expense.date), 'dd MMM yyyy', { locale: es })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      €{Number(expense.amount).toFixed(2)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};