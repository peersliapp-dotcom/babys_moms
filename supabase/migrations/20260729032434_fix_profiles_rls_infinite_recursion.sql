-- Fix: infinite recursion in profiles SELECT policy
-- The old policy queried profiles inside profiles' own RLS, causing recursion.
-- Solution: Use a SECURITY DEFINER function that bypasses RLS to check admin role.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Recreate with non-recursive admin check
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- Fix reviews policies that also reference profiles (potential recursion)
DROP POLICY IF EXISTS "reviews_admin_select" ON public.reviews;
CREATE POLICY "reviews_select_own_approved_or_admin" ON public.reviews FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_approved = true
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "reviews_admin_update" ON public.reviews;
CREATE POLICY "reviews_admin_update" ON public.reviews FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "reviews_admin_delete" ON public.reviews;
CREATE POLICY "reviews_admin_delete" ON public.reviews FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Fix orders admin update policy (also referenced profiles)
DROP POLICY IF EXISTS "orders_admin_update_courier" ON public.orders;
CREATE POLICY "orders_admin_update_courier" ON public.orders FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());