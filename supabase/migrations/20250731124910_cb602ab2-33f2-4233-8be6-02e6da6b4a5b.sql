-- Fix the search_path for the default categories function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';