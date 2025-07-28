-- Fix infinite recursion in RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Group members can view group membership" ON public.group_members;
DROP POLICY IF EXISTS "Group members can view their groups" ON public.groups;

-- Create simpler, non-recursive policies for group_members
CREATE POLICY "Users can view group memberships where they are members" 
ON public.group_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Create simpler policy for groups
CREATE POLICY "Group members can view their groups" 
ON public.groups 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  id IN (
    SELECT group_id 
    FROM group_members 
    WHERE user_id = auth.uid()
  )
);