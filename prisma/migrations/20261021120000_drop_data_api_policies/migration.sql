-- アプリは Prisma (postgres ロール、RLS をバイパス) 経由でのみ DB にアクセスし、
-- Supabase Data API (PostgREST) は使っていない。20260408120000_enable_rls で作った
-- ポリシーは anon に下書きを含む全記事の読み取りを、任意のログインユーザーに
-- 全行の書き込み・削除を許していたため、すべて削除する。
-- RLS は有効のまま残すので、Data API からのアクセスはすべて拒否される。

DROP POLICY IF EXISTS "public_select" ON public."Image";
DROP POLICY IF EXISTS "public_select" ON public."PostTag";
DROP POLICY IF EXISTS "public_select" ON public."Tag";
DROP POLICY IF EXISTS "public_select" ON public."Post";

DROP POLICY IF EXISTS "auth_insert" ON public."Image";
DROP POLICY IF EXISTS "auth_insert" ON public."PostTag";
DROP POLICY IF EXISTS "auth_insert" ON public."Tag";
DROP POLICY IF EXISTS "auth_insert" ON public."Post";

DROP POLICY IF EXISTS "auth_update" ON public."Image";
DROP POLICY IF EXISTS "auth_update" ON public."PostTag";
DROP POLICY IF EXISTS "auth_update" ON public."Tag";
DROP POLICY IF EXISTS "auth_update" ON public."Post";

DROP POLICY IF EXISTS "auth_delete" ON public."Image";
DROP POLICY IF EXISTS "auth_delete" ON public."PostTag";
DROP POLICY IF EXISTS "auth_delete" ON public."Tag";
DROP POLICY IF EXISTS "auth_delete" ON public."Post";
