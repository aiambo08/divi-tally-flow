-- Create group invitations table
CREATE TABLE public.group_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL,
  invited_email text NOT NULL,
  invited_by uuid NOT NULL,
  role group_role DEFAULT 'member',
  status character varying DEFAULT 'pending'::character varying,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  UNIQUE(group_id, invited_email)
);

-- Enable RLS on group_invitations
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for group_invitations
CREATE POLICY "Group admins can create invitations" 
ON public.group_invitations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_invitations.group_id 
    AND gm.user_id = auth.uid() 
    AND (gm.role = 'admin' OR EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_invitations.group_id 
      AND g.created_by = auth.uid()
    ))
  )
);

CREATE POLICY "Group admins can view invitations" 
ON public.group_invitations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_invitations.group_id 
    AND gm.user_id = auth.uid() 
    AND (gm.role = 'admin' OR EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_invitations.group_id 
      AND g.created_by = auth.uid()
    ))
  )
);

CREATE POLICY "Anyone can view their own invitation by token" 
ON public.group_invitations 
FOR SELECT 
USING (true);

CREATE POLICY "Group admins can update invitations" 
ON public.group_invitations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_invitations.group_id 
    AND gm.user_id = auth.uid() 
    AND (gm.role = 'admin' OR EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_invitations.group_id 
      AND g.created_by = auth.uid()
    ))
  )
);

-- Function to auto-accept invitation when user signs up
CREATE OR REPLACE FUNCTION public.handle_invitation_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invitation_record record;
BEGIN
  -- Check for pending invitations for this email
  FOR invitation_record IN 
    SELECT * FROM public.group_invitations 
    WHERE invited_email = NEW.email 
    AND status = 'pending' 
    AND expires_at > now()
  LOOP
    -- Add user to group
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (invitation_record.group_id, NEW.user_id, invitation_record.role);
    
    -- Mark invitation as accepted
    UPDATE public.group_invitations 
    SET status = 'accepted', accepted_at = now()
    WHERE id = invitation_record.id;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-accept invitations on profile creation
CREATE TRIGGER on_profile_created_handle_invitations
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_invitation_signup();