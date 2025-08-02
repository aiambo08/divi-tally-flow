-- Update default categories to have valid icons
UPDATE personal_categories 
SET icon = CASE 
  WHEN name = 'Comida' THEN 'UtensilsCrossed'
  WHEN name = 'Transporte' THEN 'Car'
  WHEN name = 'Entretenimiento' THEN 'Gamepad2'
  WHEN name = 'Compras' THEN 'ShoppingBag'
  WHEN name = 'Salud' THEN 'Heart'
  WHEN name = 'Vivienda' THEN 'Home'
  WHEN name = 'Educación' THEN 'GraduationCap'
  WHEN name = 'Viajes' THEN 'Plane'
  WHEN name = 'Otros' THEN 'MoreHorizontal'
  ELSE 'DollarSign'
END
WHERE icon NOT IN ('UtensilsCrossed', 'Car', 'Gamepad2', 'ShoppingBag', 'Heart', 'Home', 'GraduationCap', 'Plane', 'Coffee', 'Gift', 'Shirt', 'Smartphone', 'Book', 'Music', 'MoreHorizontal', 'DollarSign');