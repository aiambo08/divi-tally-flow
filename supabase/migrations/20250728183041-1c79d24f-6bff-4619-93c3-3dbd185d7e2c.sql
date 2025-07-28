-- Fix remaining RLS issues to avoid recursion

-- Drop and recreate group_members policies with simpler logic
DROP POLICY IF EXISTS "Users can view group memberships where they are members" ON public.group_members;

-- Policy to allow users to see their own membership records
CREATE POLICY "Users can view their own memberships" 
ON public.group_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy to allow group creators to see all memberships in their groups
CREATE POLICY "Group creators can view group memberships" 
ON public.group_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.created_by = auth.uid()
  )
);

-- Simplify groups policy - remove subquery to group_members
DROP POLICY IF EXISTS "Group members can view their groups" ON public.groups;

CREATE POLICY "Group creators and members can view groups" 
ON public.groups 
FOR SELECT 
USING (created_by = auth.uid());