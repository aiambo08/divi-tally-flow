-- Create personal expense categories table
CREATE TABLE public.personal_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'DollarSign',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create personal expenses table
CREATE TABLE public.personal_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.personal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for personal_categories
CREATE POLICY "Users can view their own categories" 
ON public.personal_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" 
ON public.personal_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
ON public.personal_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
ON public.personal_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for personal_expenses
CREATE POLICY "Users can view their own personal expenses" 
ON public.personal_expenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own personal expenses" 
ON public.personal_expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal expenses" 
ON public.personal_expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal expenses" 
ON public.personal_expenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create foreign key relationships
ALTER TABLE public.personal_expenses 
ADD CONSTRAINT fk_personal_expenses_category 
FOREIGN KEY (category_id) REFERENCES public.personal_categories(id) ON DELETE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_personal_categories_updated_at
BEFORE UPDATE ON public.personal_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_expenses_updated_at
BEFORE UPDATE ON public.personal_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_personal_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.personal_categories (user_id, name, color, icon) VALUES
    (NEW.user_id, 'Comida', '#ef4444', 'UtensilsCrossed'),
    (NEW.user_id, 'Transporte', '#3b82f6', 'Car'),
    (NEW.user_id, 'Entretenimiento', '#8b5cf6', 'Gamepad2'),
    (NEW.user_id, 'Compras', '#06b6d4', 'ShoppingBag'),
    (NEW.user_id, 'Salud', '#10b981', 'Heart'),
    (NEW.user_id, 'Otros', '#6b7280', 'MoreHorizontal');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add default categories when profile is created
CREATE TRIGGER on_profile_created_add_default_categories
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_personal_categories();