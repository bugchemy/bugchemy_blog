-- Auth users (simulate 2 accounts)
-- Note: In real use, Supabase Auth will create these. For dev seeding, we insert directly.
insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-000000000001', 'admin@bugchemy.dev'),
  ('00000000-0000-0000-0000-000000000002', 'user@bugchemy.dev')
on conflict do nothing;

-- Profiles
insert into profiles (id, display_name, bio, avatar_url, is_admin)
values
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'I manage the blog.', null, true),
  ('00000000-0000-0000-0000-000000000002', 'John Doe', 'Just a normal user writing stuff.', null, false)
on conflict (id) do nothing;

-- Tags
insert into tags (name)
values
  ('AI'),
  ('Web Dev'),
  ('JavaScript'),
  ('Supabase')
on conflict (name) do nothing;

-- Articles
insert into articles (author_id, title, slug, content, excerpt, cover_url, status, visibility, meta_description, seo_keywords, published_at, created_at, updated_at)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Welcome to Bugchemy!',
    'welcome-to-bugchemy',
    'This is the first admin-posted article. It introduces the Bugchemy blog.',
    'This is the first article on Bugchemy.',
    null,
    'published',
    'public',
    'Welcome to Bugchemy – your AI-powered technical blog.',
    array['AI','Blog','Supabase'],
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'My First Draft',
    'my-first-draft',
    'This draft is private to John Doe and not yet published.',
    'Draft by John Doe.',
    null,
    'draft',
    'private',
    'Draft article by John Doe.',
    array['Draft','Testing'],
    null,
    now(),
    now()
  )
on conflict (slug) do nothing;

-- Article Tags (link Welcome article with AI tag)
insert into article_tags (article_id, tag_id)
select a.id, t.id
from articles a
join tags t on t.name = 'AI'
where a.slug = 'welcome-to-bugchemy'
on conflict do nothing;


-- Article Tags (link Draft article with Web Dev + JavaScript)
insert into article_tags (article_id, tag_id)
select a.id, t.id
from articles a
join tags t on t.name in ('Web Dev','JavaScript')
where a.slug = 'my-first-draft'
on conflict do nothing;

-- Comments (on Welcome article)
insert into comments (article_id, user_id, content)
select a.id, '00000000-0000-0000-0000-000000000002', 'Great first article!'
from articles a
where a.slug = 'welcome-to-bugchemy'
on conflict do nothing;
