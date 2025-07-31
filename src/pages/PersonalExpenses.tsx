import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, TrendingUp, Calendar, PieChart } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpensesSummary } from '@/components/personal/ExpensesSummary';
import { ExpensesChart } from '@/components/personal/ExpensesChart';
import { CategoriesManager } from '@/components/personal/CategoriesManager';
import { AddExpenseForm } from '@/components/personal/AddExpenseForm';
import { usePersonalExpenses } from '@/hooks/usePersonalExpenses';

const PersonalExpenses = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddExpense, setShowAddExpense] = useState(false);
  const { expenses, categories, loading, addExpense, refreshCategories } = usePersonalExpenses();

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const handleAddExpense = async (expenseData: any) => {
    const result = await addExpense(expenseData);
    if (result) {
      setShowAddExpense(false);
      // Refresh expenses for current month
      window.location.reload();
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-primary">Mis Gastos</h1>
              <p className="text-muted-foreground">Gestiona tus gastos personales</p>
            </div>
          </div>
          
          <Button onClick={() => setShowAddExpense(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Añadir Gasto
          </Button>
        </div>

        {/* Month Navigation */}
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between p-4">
            <Button 
              variant="outline" 
              onClick={() => navigateMonth('prev')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Mes Anterior
            </Button>
            
            <h2 className="text-xl font-semibold capitalize">{monthName}</h2>
            
            <Button 
              variant="outline" 
              onClick={() => navigateMonth('next')}
              className="gap-2"
            >
              Mes Siguiente
              <Calendar className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="resumen" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resumen" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="graficas" className="gap-2">
              <PieChart className="h-4 w-4" />
              Gráficas
            </TabsTrigger>
            <TabsTrigger value="categorias" className="gap-2">
              <Plus className="h-4 w-4" />
              Categorías
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumen">
            <ExpensesSummary 
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          </TabsContent>

          <TabsContent value="graficas">
            <ExpensesChart 
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          </TabsContent>

          <TabsContent value="categorias">
            <CategoriesManager />
          </TabsContent>
        </Tabs>

        {/* Add Expense Modal */}
        <AddExpenseForm
          open={showAddExpense}
          onOpenChange={setShowAddExpense}
          onSubmit={handleAddExpense}
          categories={categories}
        />
      </div>
    </Layout>
  );
};

export default PersonalExpenses;