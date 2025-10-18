-- Enable RLS on all tables
alter table profiles enable row level security;
alter table articles enable row level security;
alter table comments enable row level security;
alter table tags enable row level security;
alter table article_tags enable row level security;
alter table ai_jobs enable row level security;

-- Profiles
create policy "Anyone can read profiles"
on profiles for select
using (true);

create policy "Users can update own profile"
on profiles for update
using (auth.uid() = id);

-- Articles
create policy "Public can read published articles"
on articles for select
using (status = 'published' and visibility = 'public');

create policy "Authors can insert drafts"
on articles for insert
with check (auth.uid() = author_id);

create policy "Authors can update own draft"
on articles for update
using (auth.uid() = author_id and status = 'draft');

create policy "Admins full access to articles"
on articles for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);

-- Comments
create policy "Anyone can read comments"
on comments for select
using (true);

create policy "Users can insert comments"
on comments for insert
with check (auth.uid() = user_id);

create policy "Users can update own comments"
on comments for update
using (auth.uid() = user_id);

create policy "Users can delete own comments"
on comments for delete
using (auth.uid() = user_id);

-- Tags
create policy "Anyone can read tags"
on tags for select
using (true);

create policy "Admins manage tags"
on tags for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);

-- Article Tags
create policy "Anyone can read article_tags"
on article_tags for select
using (true);

create policy "Admins manage article_tags"
on article_tags for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);

-- AI Jobs
create policy "Admins full access to ai_jobs"
on ai_jobs for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);
