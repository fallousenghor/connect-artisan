-- =========================================================
-- ArtisanConnect — Schéma Supabase (MVP)
-- À exécuter dans Supabase : SQL Editor > New query > Run
-- =========================================================

-- Extension pour la génération d'UUID
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. Table des métiers (référentiel)
-- ---------------------------------------------------------
create table if not exists public.metiers (
  id serial primary key,
  nom text unique not null,
  icone text not null default 'wrench'
);

insert into public.metiers (nom, icone) values
  ('Plombier', 'wrench'),
  ('Électricien', 'zap'),
  ('Maçon', 'hammer'),
  ('Menuisier', 'axe'),
  ('Peintre', 'paintbrush'),
  ('Mécanicien', 'car'),
  ('Couturier / Couturière', 'scissors'),
  ('Coiffeur / Coiffeuse', 'scissors'),
  ('Soudeur', 'flame'),
  ('Climaticien', 'wind'),
  ('Jardinier', 'sprout'),
  ('Photographe', 'camera')
on conflict (nom) do nothing;

-- ---------------------------------------------------------
-- 2. Profils utilisateurs (lié à auth.users)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'artisan', 'admin')),
  nom_complet text not null,
  telephone text,
  whatsapp text,
  avatar_url text,
  cover_url text,
  created_at timestamptz not null default now()
);

-- Migration : si la table existait déjà sans la colonne cover_url
alter table public.profiles add column if not exists cover_url text;

-- ---------------------------------------------------------
-- 2bis. Création automatique du profil à l'inscription
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role text;
begin
  v_role := coalesce(new.raw_user_meta_data ->> 'role', 'client');

  insert into public.profiles (id, role, nom_complet, telephone, whatsapp)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'nom_complet', 'Utilisateur'),
    new.raw_user_meta_data ->> 'telephone',
    coalesce(new.raw_user_meta_data ->> 'whatsapp', new.raw_user_meta_data ->> 'telephone')
  )
  on conflict (id) do nothing;

  if v_role = 'artisan' then
    insert into public.artisans_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- 3. Profils artisans (extension du profil)
-- ---------------------------------------------------------
create table if not exists public.artisans_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  metier_id integer references public.metiers(id),
  description text,
  ville text,
  quartier text,
  latitude double precision,
  longitude double precision,
  disponible boolean not null default true,
  verifie boolean not null default false,
  note_moyenne numeric(2,1) not null default 0,
  nombre_avis integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_artisans_metier on public.artisans_profiles (metier_id);
create index if not exists idx_artisans_ville on public.artisans_profiles (ville);
create index if not exists idx_artisans_geo on public.artisans_profiles (latitude, longitude);

-- ---------------------------------------------------------
-- 4. Publications (réalisations des artisans)
-- ---------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisans_profiles(id) on delete cascade,
  media_url text not null,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  description text,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_artisan on public.posts (artisan_id);
create index if not exists idx_posts_created on public.posts (created_at desc);

-- ---------------------------------------------------------
-- 5. Avis / notation
-- ---------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisans_profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  note integer not null check (note between 1 and 5),
  commentaire text,
  created_at timestamptz not null default now(),
  unique (artisan_id, client_id)
);

create index if not exists idx_reviews_artisan on public.reviews (artisan_id);

-- Recalcule automatiquement la note moyenne de l'artisan
create or replace function public.recalculer_note_artisan()
returns trigger as $$
begin
  update public.artisans_profiles
  set
    note_moyenne = coalesce((select round(avg(note)::numeric, 1) from public.reviews where artisan_id = coalesce(new.artisan_id, old.artisan_id)), 0),
    nombre_avis = (select count(*) from public.reviews where artisan_id = coalesce(new.artisan_id, old.artisan_id))
  where id = coalesce(new.artisan_id, old.artisan_id);
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_reviews_insert on public.reviews;
create trigger trg_reviews_insert after insert or update or delete on public.reviews
for each row execute function public.recalculer_note_artisan();

-- ---------------------------------------------------------
-- 5bis. Mentions "j'aime" sur les publications
-- ---------------------------------------------------------
create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_likes_post on public.post_likes (post_id);
create index if not exists idx_likes_user on public.post_likes (user_id);

alter table public.post_likes enable row level security;
drop policy if exists "likes_lecture_publique" on public.post_likes;
create policy "likes_lecture_publique" on public.post_likes for select using (true);
drop policy if exists "likes_insertion_soi_meme" on public.post_likes;
create policy "likes_insertion_soi_meme" on public.post_likes for insert with check (auth.uid() = user_id);
drop policy if exists "likes_suppression_soi_meme" on public.post_likes;
create policy "likes_suppression_soi_meme" on public.post_likes for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.artisans_profiles enable row level security;
alter table public.posts enable row level security;
alter table public.reviews enable row level security;
alter table public.metiers enable row level security;

-- metiers : lecture publique
drop policy if exists "metiers_lecture_publique" on public.metiers;
create policy "metiers_lecture_publique" on public.metiers for select using (true);

-- profiles : lecture publique, écriture par le propriétaire uniquement
drop policy if exists "profiles_lecture_publique" on public.profiles;
create policy "profiles_lecture_publique" on public.profiles for select using (true);
drop policy if exists "profiles_insertion_soi_meme" on public.profiles;
create policy "profiles_insertion_soi_meme" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_maj_soi_meme" on public.profiles;
create policy "profiles_maj_soi_meme" on public.profiles for update using (auth.uid() = id);

-- artisans_profiles : lecture publique, écriture par le propriétaire
drop policy if exists "artisans_lecture_publique" on public.artisans_profiles;
create policy "artisans_lecture_publique" on public.artisans_profiles for select using (true);
drop policy if exists "artisans_insertion_soi_meme" on public.artisans_profiles;
create policy "artisans_insertion_soi_meme" on public.artisans_profiles for insert with check (auth.uid() = id);
drop policy if exists "artisans_maj_soi_meme" on public.artisans_profiles;
create policy "artisans_maj_soi_meme" on public.artisans_profiles for update using (auth.uid() = id);

-- posts : lecture publique, écriture par l'artisan propriétaire
drop policy if exists "posts_lecture_publique" on public.posts;
create policy "posts_lecture_publique" on public.posts for select using (true);
drop policy if exists "posts_insertion_par_artisan" on public.posts;
create policy "posts_insertion_par_artisan" on public.posts for insert with check (auth.uid() = artisan_id);
drop policy if exists "posts_maj_par_artisan" on public.posts;
create policy "posts_maj_par_artisan" on public.posts for update using (auth.uid() = artisan_id);
drop policy if exists "posts_suppression_par_artisan" on public.posts;
create policy "posts_suppression_par_artisan" on public.posts for delete using (auth.uid() = artisan_id);

-- reviews : lecture publique, un client peut créer/modifier son propre avis
drop policy if exists "reviews_lecture_publique" on public.reviews;
create policy "reviews_lecture_publique" on public.reviews for select using (true);
drop policy if exists "reviews_insertion_par_client" on public.reviews;
create policy "reviews_insertion_par_client" on public.reviews for insert with check (auth.uid() = client_id);
drop policy if exists "reviews_maj_par_client" on public.reviews;
create policy "reviews_maj_par_client" on public.reviews for update using (auth.uid() = client_id);
drop policy if exists "reviews_suppression_par_client" on public.reviews;
create policy "reviews_suppression_par_client" on public.reviews for delete using (auth.uid() = client_id);

-- ---------------------------------------------------------
-- 6bis. Back-office admin de modération
-- ---------------------------------------------------------
-- Fonction utilitaire : l'utilisateur connecté est-il admin ?
-- (security definer pour pouvoir être utilisée dans les policies sans
--  provoquer de récursion sur la table profiles)
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- Un admin peut tout lire/modifier sur les artisans (ex : activer le badge vérifié)
drop policy if exists "artisans_maj_admin" on public.artisans_profiles;
create policy "artisans_maj_admin" on public.artisans_profiles for update using (public.is_admin());

-- Un admin peut supprimer n'importe quelle publication ou avis (modération)
drop policy if exists "posts_suppression_admin" on public.posts;
create policy "posts_suppression_admin" on public.posts for delete using (public.is_admin());
drop policy if exists "reviews_suppression_admin" on public.reviews;
create policy "reviews_suppression_admin" on public.reviews for delete using (public.is_admin());

-- Un admin peut consulter la liste des comptes (emails via une vue dédiée, voir plus bas)
drop policy if exists "profiles_maj_admin" on public.profiles;
create policy "profiles_maj_admin" on public.profiles for update using (public.is_admin());

-- ---------------------------------------------------------
-- 7. Stockage (bucket pour les médias des publications + avatars)
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_lecture_publique" on storage.objects;
create policy "media_lecture_publique" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media_upload_authentifie" on storage.objects;
create policy "media_upload_authentifie" on storage.objects for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');
drop policy if exists "media_maj_proprietaire" on storage.objects;
create policy "media_maj_proprietaire" on storage.objects for update using (bucket_id = 'media' and owner = auth.uid());
drop policy if exists "media_suppression_proprietaire" on storage.objects;
create policy "media_suppression_proprietaire" on storage.objects for delete using (bucket_id = 'media' and owner = auth.uid());
drop policy if exists "media_suppression_admin" on storage.objects;
create policy "media_suppression_admin" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------
-- 8. Messagerie interne (chat client ↔ artisan)
-- ---------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  artisan_id uuid not null references public.artisans_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (client_id, artisan_id)
);

create index if not exists idx_conversations_client on public.conversations (client_id);
create index if not exists idx_conversations_artisan on public.conversations (artisan_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);

-- Met à jour la date du dernier message sur la conversation (pour le tri de la liste)
create or replace function public.bump_conversation_last_message()
returns trigger as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_messages_bump on public.messages;
create trigger trg_messages_bump after insert on public.messages
for each row execute function public.bump_conversation_last_message();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversations_lecture_participants" on public.conversations;
create policy "conversations_lecture_participants" on public.conversations for select
  using (auth.uid() = client_id or auth.uid() = artisan_id);

drop policy if exists "conversations_insertion_participants" on public.conversations;
create policy "conversations_insertion_participants" on public.conversations for insert
  with check (auth.uid() = client_id or auth.uid() = artisan_id);

drop policy if exists "conversations_maj_participants" on public.conversations;
create policy "conversations_maj_participants" on public.conversations for update
  using (auth.uid() = client_id or auth.uid() = artisan_id);

drop policy if exists "messages_lecture_participants" on public.messages;
create policy "messages_lecture_participants" on public.messages for select
  using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and (c.client_id = auth.uid() or c.artisan_id = auth.uid())
  ));

drop policy if exists "messages_insertion_participants" on public.messages;
create policy "messages_insertion_participants" on public.messages for insert
  with check (
    sender_id = auth.uid() and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and (c.client_id = auth.uid() or c.artisan_id = auth.uid())
    )
  );

drop policy if exists "messages_maj_participants" on public.messages;
create policy "messages_maj_participants" on public.messages for update
  using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and (c.client_id = auth.uid() or c.artisan_id = auth.uid())
  ));

-- Active le temps réel (Realtime) sur la table messages (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ---------------------------------------------------------
-- 9. Abonnements aux notifications push (Web Push)
-- ---------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_lecture_soi_meme" on public.push_subscriptions;
create policy "push_lecture_soi_meme" on public.push_subscriptions for select using (auth.uid() = user_id);

drop policy if exists "push_insertion_soi_meme" on public.push_subscriptions;
create policy "push_insertion_soi_meme" on public.push_subscriptions for insert with check (auth.uid() = user_id);

drop policy if exists "push_suppression_soi_meme" on public.push_subscriptions;
create policy "push_suppression_soi_meme" on public.push_subscriptions for delete using (auth.uid() = user_id);

-- La Edge Function "send-push" utilise la clé de service (service_role) pour lire
-- les abonnements de n'importe quel destinataire lors de l'envoi ; elle contourne
-- donc naturellement RLS (le service_role a toujours accès complet), aucune policy
-- supplémentaire n'est nécessaire ici.

-- ---------------------------------------------------------
-- 10. Abonnement Premium (monétisation)
-- ---------------------------------------------------------
-- Date jusqu'à laquelle l'artisan est premium (NULL = jamais premium / expiré)
alter table public.artisans_profiles add column if not exists premium_until timestamptz;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisans_profiles(id) on delete cascade,
  plan text not null check (plan in ('mensuel', 'annuel')),
  amount integer not null,
  currency text not null default 'XOF',
  transaction_id text not null unique,
  status text not null default 'en_attente' check (status in ('en_attente', 'actif', 'echoue')),
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_artisan on public.subscriptions (artisan_id);
create index if not exists idx_subscriptions_transaction on public.subscriptions (transaction_id);

alter table public.subscriptions enable row level security;

-- Lecture : l'artisan voit ses propres abonnements, l'admin voit tout (statistiques de revenus)
drop policy if exists "subscriptions_lecture_soi_meme" on public.subscriptions;
create policy "subscriptions_lecture_soi_meme" on public.subscriptions for select
  using (auth.uid() = artisan_id or public.is_admin());

-- Écriture : volontairement AUCUNE policy insert/update/delete pour les utilisateurs.
-- Seules les Edge Functions "creer-abonnement" et "verifier-abonnement" (via la clé
-- service_role, qui contourne RLS) peuvent créer/mettre à jour un abonnement. Cela
-- empêche un utilisateur de s'auto-attribuer le statut premium en écrivant en direct
-- dans la table.
