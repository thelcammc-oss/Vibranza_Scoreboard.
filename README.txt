VIBRANZA Supabase House Points Website

1. Open supabase-config.js and enter your Supabase Project URL and Publishable/anon key.
2. In Supabase SQL Editor, run supabase-setup.sql. The SQL contains the admin UID you supplied.
3. Supabase Authentication > Users: create/confirm your admin account. Disable public signups.
4. Upload all files in this folder to your GitHub Pages repository root.
5. Public dashboard reads shared points; admin signs in with Supabase email/password.
6. Admin event input provides suggestions from your uploaded list and also accepts custom event names.

Never put a Supabase service_role/secret key in frontend files. Use only the publishable/anon key with RLS enabled.
