-- Fix infinite recursion in group_members RLS policies

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can delete members" ON public.group_members;

-- Create simpler, non-recursive policies
CREATE POLICY "Group creators can manage all members" 
ON public.group_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete their own membership" 
ON public.group_members 
FOR DELETE 
USING (user_id = auth.uid());