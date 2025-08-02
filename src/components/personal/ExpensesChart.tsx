import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { usePersonalExpenses } from '@/hooks/usePersonalExpenses';

interface ExpensesChartProps {
  currentMonth: number;
  currentYear: number;
}

interface ChartData {
  name: string;
  amount: number;
  color: string;
}

interface DailyData {
  date: string;
  amount: number;
}

export const ExpensesChart = ({ currentMonth, currentYear }: ExpensesChartProps) => {
  const { expenses, loading, fetchExpenses } = usePersonalExpenses();
  const [categoryData, setCategoryData] = useState<ChartData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);

  useEffect(() => {
    fetchExpenses(currentYear, currentMonth);
  }, [currentMonth, currentYear, fetchExpenses]);

  useEffect(() => {
    if (expenses.length > 0) {
      // Prepare category data for pie chart
      const categoryTotals = expenses.reduce((acc, expense) => {
        const categoryName = expense.category?.name || 'Sin categoría';
        const categoryColor = expense.category?.color || '#6b7280';
        
        if (acc[categoryName]) {
          acc[categoryName].amount += Number(expense.amount);
        } else {
          acc[categoryName] = {
            name: categoryName,
            amount: Number(expense.amount),
            color: categoryColor
          };
        }
        return acc;
      }, {} as Record<string, ChartData>);

      setCategoryData(Object.values(categoryTotals));

      // Prepare daily data for bar chart
      const dailyTotals = expenses.reduce((acc, expense) => {
        const date = expense.date;
        if (acc[date]) {
          acc[date] += Number(expense.amount);
        } else {
          acc[date] = Number(expense.amount);
        }
        return acc;
      }, {} as Record<string, number>);

      const dailyChartData = Object.entries(dailyTotals)
        .map(([date, amount]) => ({
          date: new Date(date).getDate().toString(),
          amount
        }))
        .sort((a, b) => Number(a.date) - Number(b.date));

      setDailyData(dailyChartData);
    } else {
      setCategoryData([]);
      setDailyData([]);
    }
  }, [expenses]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Cargando gráficas...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No hay datos suficientes para mostrar gráficas
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Distribution - Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{}}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Daily Expenses - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos Diarios</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{}}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis 
                  dataKey="date" 
                  label={{ value: 'Día del mes', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Importe (€)', angle: -90, position: 'insideLeft' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              €{categoryData.reduce((sum, cat) => sum + cat.amount, 0).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Total del Mes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              €{dailyData.length > 0 ? (categoryData.reduce((sum, cat) => sum + cat.amount, 0) / dailyData.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-sm text-muted-foreground">Promedio Diario</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {categoryData.length}
            </div>
            <p className="text-sm text-muted-foreground">Categorías Usadas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};