begin;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles readable by owner'
  ) then
    create policy "profiles readable by owner" on public.profiles
      for select to authenticated
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles insert by owner'
  ) then
    create policy "profiles insert by owner" on public.profiles
      for insert to authenticated
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles update by owner'
  ) then
    create policy "profiles update by owner" on public.profiles
      for update to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;


do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_media' and policyname='user_media readable by owner'
  ) then
    create policy "user_media readable by owner" on public.user_media
      for select to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_media' and policyname='user_media insert by owner'
  ) then
    create policy "user_media insert by owner" on public.user_media
      for insert to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_media' and policyname='user_media update by owner'
  ) then
    create policy "user_media update by owner" on public.user_media
      for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_media' and policyname='user_media delete by owner'
  ) then
    create policy "user_media delete by owner" on public.user_media
      for delete to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;


do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_progress' and policyname='user_progress readable by owner'
  ) then
    create policy "user_progress readable by owner" on public.user_progress
      for select to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_progress' and policyname='user_progress insert by owner'
  ) then
    create policy "user_progress insert by owner" on public.user_progress
      for insert to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_progress' and policyname='user_progress update by owner'
  ) then
    create policy "user_progress update by owner" on public.user_progress
      for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_progress' and policyname='user_progress delete by owner'
  ) then
    create policy "user_progress delete by owner" on public.user_progress
      for delete to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;


do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='watch_history' and policyname='watch_history readable by owner'
  ) then
    create policy "watch_history readable by owner" on public.watch_history
      for select to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='watch_history' and policyname='watch_history insert by owner'
  ) then
    create policy "watch_history insert by owner" on public.watch_history
      for insert to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='watch_history' and policyname='watch_history update by owner'
  ) then
    create policy "watch_history update by owner" on public.watch_history
      for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='watch_history' and policyname='watch_history delete by owner'
  ) then
    create policy "watch_history delete by owner" on public.watch_history
      for delete to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;


grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_media to authenticated;
grant select, insert, update, delete on public.user_progress to authenticated;
grant select, insert, update, delete on public.watch_history to authenticated;

grant usage, select on sequence user_media_id_seq to authenticated;
grant usage, select on sequence user_progress_id_seq to authenticated;

notify pgrst, 'reload schema';

commit;
