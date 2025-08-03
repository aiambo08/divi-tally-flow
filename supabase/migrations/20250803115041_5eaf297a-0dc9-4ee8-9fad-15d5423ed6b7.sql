-- Add role column to group_members table
ALTER TABLE public.group_members 
ADD COLUMN role character varying DEFAULT 'member'::character varying;

-- Create enum for group roles
CREATE TYPE public.group_role AS ENUM ('admin', 'member');

-- Update the role column to use the enum
ALTER TABLE public.group_members 
ALTER COLUMN role TYPE group_role USING role::group_role;

-- Update RLS policies for group_members to allow admins to manage members
CREATE POLICY "Group admins can manage members" 
ON public.group_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND (gm.role = 'admin' OR EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_members.group_id 
      AND g.created_by = auth.uid()
    ))
  )
);

-- Group admins can delete members
CREATE POLICY "Group admins can delete members" 
ON public.group_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND (gm.role = 'admin' OR EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_members.group_id 
      AND g.created_by = auth.uid()
    ))
  )
);

-- Set the group creator as admin automatically
UPDATE public.group_members 
SET role = 'admin' 
WHERE user_id IN (
  SELECT created_by FROM public.groups 
  WHERE id = group_members.group_id
);