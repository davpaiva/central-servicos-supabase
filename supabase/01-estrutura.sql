-- ============================================================
-- 01-estrutura.sql — CRIA AS TABELAS E AS REGRAS DE ACESSO
-- ============================================================
-- Rode este arquivo PRIMEIRO, no Supabase: menu SQL Editor >
-- New query > cole tudo > Run.
--
-- Ele cria:
--   prazos          -> prazo (em dias) de cada tipo de serviço
--   ordens          -> as ordens de serviço
--   perfis          -> nome e perfil (gestor/consulta) de cada usuário
--   ordens_detalhe  -> uma "view": as ordens com dias e atraso já calculados
--   concluir_ordem  -> função que conclui uma ordem (só para gestores)
--
-- E as REGRAS DE ACESSO (RLS = Row Level Security). Elas fazem o
-- papel do servidor Node da versão anterior: quem não fez login
-- não vê nada, e só gestor consegue concluir ordem.
-- ============================================================


-- ---------- 1. TABELAS ----------

create table public.prazos (
  tipo_servico text primary key,
  prazo_dias   integer not null
);

create table public.ordens (
  numero          text primary key,               -- ex.: OS-00001
  data_entrada    date not null,
  data_conclusao  date,                           -- vazio enquanto pendente
  tipo_servico    text not null references public.prazos (tipo_servico),
  regional        text not null,
  prioridade      text not null check (prioridade in ('Alta', 'Média', 'Baixa')),
  status          text not null check (status in ('Pendente', 'Realizado')),
  cliente         text not null,
  concluida_por   text                            -- quem concluiu pelo site
);

-- Uma linha por usuário. O "id" é o mesmo do usuário criado no
-- menu Authentication do Supabase (tabela auth.users).
create table public.perfis (
  id     uuid primary key references auth.users (id) on delete cascade,
  nome   text not null,
  perfil text not null default 'consulta' check (perfil in ('gestor', 'consulta'))
);


-- ---------- 2. VIEW COM OS CAMPOS CALCULADOS ----------
-- Uma view é uma "consulta salva" que se usa como se fosse tabela.
-- "security_invoker" faz a view respeitar as regras de acesso de
-- quem está consultando (sem isso, ela pularia o RLS).
--
-- Data de referência: os dados de exemplo vão até 30/09/2026.
-- Num sistema real, troque date '2026-09-30' por current_date.

create view public.ordens_detalhe with (security_invoker = true) as
select
  o.*,
  p.prazo_dias as prazo,
  coalesce(o.data_conclusao, date '2026-09-30') - o.data_entrada                  as dias,
  coalesce(o.data_conclusao, date '2026-09-30') - o.data_entrada > p.prazo_dias   as atrasada,
  case o.prioridade when 'Alta' then 1 when 'Média' then 2 else 3 end             as prioridade_ordem
from public.ordens o
join public.prazos p on p.tipo_servico = o.tipo_servico;


-- ---------- 3. REGRAS DE ACESSO (RLS) ----------
-- Com o RLS ligado, ninguém acessa nada, a não ser o que uma
-- "policy" (regra) liberar explicitamente.

alter table public.prazos enable row level security;
alter table public.ordens enable row level security;
alter table public.perfis enable row level security;

-- Quem fez login (papel "authenticated") pode LER prazos e ordens
create policy "logados leem prazos" on public.prazos
  for select to authenticated using (true);

create policy "logados leem ordens" on public.ordens
  for select to authenticated using (true);

-- Cada pessoa só lê o PRÓPRIO perfil. auth.uid() = id de quem fez login.
create policy "cada um le o proprio perfil" on public.perfis
  for select to authenticated using (id = auth.uid());

-- Não existe nenhuma regra de INSERT, UPDATE ou DELETE: pelo site,
-- ninguém altera as tabelas diretamente. A única alteração possível
-- é pela função concluir_ordem, que confere o perfil antes.

-- O Supabase só deixa o site enxergar o que for liberado aqui:
grant select on public.prazos, public.ordens, public.perfis, public.ordens_detalhe to authenticated;


-- ---------- 4. FUNÇÃO PARA CONCLUIR UMA ORDEM ----------
-- "security definer" = a função roda com permissão do dono do banco,
-- por isso consegue alterar a tabela. Ela mesma confere o perfil.

create function public.concluir_ordem(p_numero text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text;
begin
  select nome into v_nome
  from public.perfis
  where id = auth.uid() and perfil = 'gestor';

  if v_nome is null then
    raise exception 'Seu perfil não tem permissão para concluir ordens.';
  end if;

  update public.ordens
     set status = 'Realizado',
         data_conclusao = date '2026-09-30',     -- num sistema real: current_date
         concluida_por = v_nome
   where numero = p_numero
     and status = 'Pendente';

  if not found then
    raise exception 'Ordem não encontrada ou já realizada.';
  end if;
end;
$$;

-- Só quem fez login pode chamar a função (e ela ainda confere o perfil)
revoke execute on function public.concluir_ordem(text) from public, anon;
grant execute on function public.concluir_ordem(text) to authenticated;


-- ---------- 5. PERFIL AUTOMÁTICO PARA CADA USUÁRIO NOVO ----------
-- Sempre que um usuário é criado no Authentication, este "gatilho"
-- cria a linha dele em perfis, com perfil "consulta".
-- Para virar gestor, rode o 03-usuarios.sql.

create function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, perfil)
  values (new.id, split_part(new.email, '@', 1), 'consulta');
  return new;
end;
$$;

revoke execute on function public.criar_perfil() from public, anon, authenticated;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();
