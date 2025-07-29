-- Create a security definer function to check group membership safely
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_uuid AND user_id = user_uuid
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update groups policy to use the function
DROP POLICY IF EXISTS "Group creators and members can view groups" ON public.groups;

CREATE POLICY "Group creators and members can view groups" 
ON public.groups 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  public.is_group_member(id, auth.uid())
);