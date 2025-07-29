-- Añadir campos a expense_shares para división personalizada
ALTER TABLE expense_shares 
ADD COLUMN share_type VARCHAR(20) DEFAULT 'equal',
ADD COLUMN custom_percentage DECIMAL(5,2),
ADD COLUMN custom_amount NUMERIC;

-- Nueva tabla para plantillas de división
CREATE TABLE split_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en split_templates
ALTER TABLE split_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para split_templates
CREATE POLICY "Group members can view split templates" 
ON split_templates 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM group_members 
  WHERE group_members.group_id = split_templates.group_id 
  AND group_members.user_id = auth.uid()
));

CREATE POLICY "Group members can create split templates" 
ON split_templates 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by 
  AND EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = split_templates.group_id 
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Template creators can update their templates" 
ON split_templates 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Template creators can delete their templates" 
ON split_templates 
FOR DELETE 
USING (auth.uid() = created_by);

-- Trigger para actualizar updated_at en split_templates
CREATE TRIGGER update_split_templates_updated_at
  BEFORE UPDATE ON split_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();