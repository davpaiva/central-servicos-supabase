-- ============================================================
-- 03-usuarios.sql — DÁ NOME E PERFIL AOS USUÁRIOS
-- ============================================================
-- Rode este arquivo DEPOIS de criar os dois usuários no menu
-- Authentication > Users > Add user (o guia mostra como):
--   ana.ribeiro@example.com
--   joao.martins@example.com
--
-- O gatilho já criou os dois em "perfis", com perfil "consulta".
-- Aqui colocamos o nome completo e fazemos a Ana virar gestora.
-- ============================================================

update public.perfis
   set nome = 'Ana Ribeiro', perfil = 'gestor'
 where id = (select id from auth.users where email = 'ana.ribeiro@example.com');

update public.perfis
   set nome = 'João Martins', perfil = 'consulta'
 where id = (select id from auth.users where email = 'joao.martins@example.com');

-- Confere o resultado: deve mostrar 2 linhas
select u.email, p.nome, p.perfil
  from public.perfis p
  join auth.users u on u.id = p.id;
