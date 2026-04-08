-- Enable RLS on all public tables
ALTER TABLE public."Image" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PostTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Post" ENABLE ROW LEVEL SECURITY;

-- SELECT: 誰でも読める
CREATE POLICY "public_select" ON public."Image"   FOR SELECT USING (true);
CREATE POLICY "public_select" ON public."PostTag"  FOR SELECT USING (true);
CREATE POLICY "public_select" ON public."Tag"      FOR SELECT USING (true);
CREATE POLICY "public_select" ON public."Post"     FOR SELECT USING (true);

-- INSERT: ログインユーザーのみ
CREATE POLICY "auth_insert" ON public."Image"   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert" ON public."PostTag"  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert" ON public."Tag"      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert" ON public."Post"     FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: ログインユーザーのみ
CREATE POLICY "auth_update" ON public."Image"   FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update" ON public."PostTag"  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update" ON public."Tag"      FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update" ON public."Post"     FOR UPDATE USING (auth.uid() IS NOT NULL);

-- DELETE: ログインユーザーのみ
CREATE POLICY "auth_delete" ON public."Image"   FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete" ON public."PostTag"  FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete" ON public."Tag"      FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete" ON public."Post"     FOR DELETE USING (auth.uid() IS NOT NULL);
