import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface PersonalCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalExpense {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
  category?: PersonalCategory;
}

export const usePersonalExpenses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<PersonalCategory[]>([]);
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('personal_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las categorías",
      });
    }
  };

  // Fetch expenses for a specific month
  const fetchExpenses = useCallback(async (year: number, month: number) => {
    if (!user) return;

    try {
      setLoading(true);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('personal_expenses')
        .select(`
          *,
          category:personal_categories(*)
        `)
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los gastos",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Add new expense
  const addExpense = async (expenseData: {
    category_id: string;
    amount: number;
    description?: string;
    date: string;
  }) => {
    if (!user) return null;

    try {
      setSubmitting(true);
      const { data, error } = await supabase
        .from('personal_expenses')
        .insert({
          ...expenseData,
          user_id: user.id,
        })
        .select(`
          *,
          category:personal_categories(*)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Gasto añadido",
        description: "El gasto se ha registrado correctamente",
      });

      return data;
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo añadir el gasto",
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  // Add new category
  const addCategory = async (categoryData: {
    name: string;
    color: string;
    icon: string;
  }) => {
    if (!user) return null;

    try {
      setSubmitting(true);
      const { data, error } = await supabase
        .from('personal_categories')
        .insert({
          ...categoryData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));

      toast({
        title: "Categoría creada",
        description: "La nueva categoría se ha creado correctamente",
      });

      return data;
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la categoría",
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  // Update category
  const updateCategory = async (categoryId: string, updates: {
    name?: string;
    color?: string;
    icon?: string;
  }) => {
    try {
      setSubmitting(true);
      const { data, error } = await supabase
        .from('personal_categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => 
        prev.map(cat => cat.id === categoryId ? data : cat).sort((a, b) => a.name.localeCompare(b.name))
      );

      toast({
        title: "Categoría actualizada",
        description: "Los cambios se han guardado correctamente",
      });

      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la categoría",
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  // Delete category
  const deleteCategory = async (categoryId: string) => {
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('personal_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));

      toast({
        title: "Categoría eliminada",
        description: "La categoría se ha eliminado correctamente",
      });

      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la categoría",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Delete expense
  const deleteExpense = async (expenseId: string) => {
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('personal_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));

      toast({
        title: "Gasto eliminado",
        description: "El gasto se ha eliminado correctamente",
      });

      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el gasto",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  return {
    categories,
    expenses,
    loading,
    submitting,
    fetchExpenses,
    addExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteExpense,
    refreshCategories: fetchCategories,
  };
};