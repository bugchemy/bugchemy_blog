-- 1. Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- 2. Articles
create table articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id),
  title text not null,
  slug text unique not null,
  content text not null, -- markdown or html
  excerpt text,
  cover_url text,
  status text not null default 'draft', -- draft, review, published
  visibility text not null default 'public',
  meta_description text,
  seo_keywords text[],
  canonical_url text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Tags
create table tags (
  id serial primary key,
  name text unique not null
);

create table article_tags (
  article_id uuid references articles(id) on delete cascade,
  tag_id int references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- 4. AI Jobs (for automatic article generation)
create table ai_jobs (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  topic text,
  model text,
  status text not null default 'queued',
  article_id uuid references articles(id),
  result_summary text,
  error_text text,
  created_at timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz
);

-- 5. Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete cascade,
  user_id uuid references profiles(id),
  content text not null,
  status text not null default 'visible',
  created_at timestamptz default now()
);
