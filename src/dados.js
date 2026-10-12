// ============================================================
// dados.js — TODA A CONVERSA COM O SUPABASE FICA AQUI
// ============================================================
// As telas nunca falam com o Supabase diretamente: chamam as
// funções deste arquivo. Se um dia você trocar o Supabase por
// outro serviço, só este arquivo muda.
//
// Compare com a versão Node: lá o NOSSO servidor conferia o login
// e as permissões. Aqui o Supabase faz isso, usando as regras que
// criamos em SQL (supabase/01-estrutura.sql).
// ============================================================

import { supabase } from "./supabase.js";


// --- 1. LOGIN ---

export async function entrar(email, senha) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
  if (error) throw new Error(traduzirErro(error.message));
}

export async function sair() {
  await supabase.auth.signOut();
}

// Nome e perfil (gestor/consulta) de quem fez login, da tabela "perfis"
export async function buscarPerfil(idUsuario) {
  const { data, error } = await supabase
    .from("perfis")
    .select("nome, perfil")
    .eq("id", idUsuario)
    .maybeSingle();                  // uma linha só (ou nenhuma)
  if (error) throw new Error(traduzirErro(error.message));
  if (!data) throw new Error("Seu usuário não tem perfil cadastrado. Rode o arquivo supabase/03-usuarios.sql.");
  return data;
}


// --- 2. DADOS DO DASHBOARD ---
// Busca as ordens (só as colunas necessárias) uma vez. As contas
// dos gráficos são feitas no navegador, em calculos.js.
// Atenção: o Supabase devolve no máximo 1.000 linhas por pedido.
// Com mais dados que isso, o certo é fazer as contas no banco (SQL).
export async function buscarOrdensParaDashboard() {
  const { data, error } = await supabase
    .from("ordens_detalhe")
    .select("data_entrada, data_conclusao, tipo_servico, regional, prioridade, status, dias, atrasada");
  if (error) throw new Error(traduzirErro(error.message));
  return data;
}


// --- 3. LISTA: filtros, ordenação e páginas feitos pelo banco ---
const POR_PAGINA = 15;

export async function buscarOrdens({ filtros, ordenar, direcao, pagina }) {
  // count: "exact" = o banco também conta quantas linhas existem no total
  let consulta = supabase.from("ordens_detalhe").select("*", { count: "exact" });

  // Cada filtro preenchido acrescenta uma condição (como um WHERE do SQL)
  if (filtros.status)   consulta = consulta.eq("status", filtros.status);
  if (filtros.regional) consulta = consulta.eq("regional", filtros.regional);
  if (filtros.tipo)     consulta = consulta.eq("tipo_servico", filtros.tipo);
  if (filtros.atrasadas === "sim") consulta = consulta.eq("atrasada", true);

  // Busca no número OU no cliente (ilike = "contém", sem diferenciar maiúsculas)
  const texto = (filtros.busca || "").replace(/[,()%*]/g, " ").trim();
  if (texto) consulta = consulta.or(`numero.ilike.%${texto}%,cliente.ilike.%${texto}%`);

  // Ordenação (como um ORDER BY). Prioridade usa a coluna numérica 1-2-3.
  const coluna = ordenar === "prioridade" ? "prioridade_ordem" : ordenar;
  consulta = consulta
    .order(coluna, { ascending: direcao === "asc" })
    .order("numero", { ascending: true });

  // Página: pede só as linhas daquela página (como LIMIT/OFFSET)
  const inicio = (pagina - 1) * POR_PAGINA;
  consulta = consulta.range(inicio, inicio + POR_PAGINA - 1);

  const { data, count, error } = await consulta;

  // Pediu uma página que não existe mais? Volta para a primeira.
  if (error && pagina > 1) return buscarOrdens({ filtros, ordenar, direcao, pagina: 1 });
  if (error) throw new Error(traduzirErro(error.message));

  return {
    ordens: data,
    total: count,
    pagina,
    totalPaginas: Math.max(1, Math.ceil(count / POR_PAGINA)),
  };
}

// Opções dos filtros (regionais e tipos de serviço) e total geral
export async function buscarOpcoes() {
  const [regionais, prazos] = await Promise.all([
    supabase.from("ordens").select("regional"),
    supabase.from("prazos").select("tipo_servico").order("tipo_servico"),
  ]);
  if (regionais.error) throw new Error(traduzirErro(regionais.error.message));
  if (prazos.error) throw new Error(traduzirErro(prazos.error.message));
  return {
    regionais: [...new Set(regionais.data.map(r => r.regional))].sort(),
    tipos: prazos.data.map(p => p.tipo_servico),
    totalGeral: regionais.data.length,
  };
}


// --- 4. CONCLUIR UMA ORDEM ---
// Chama a função concluir_ordem do banco (rpc = "chamar função remota").
// É o BANCO que confere se a pessoa é gestora, não a tela.
export async function concluirOrdem(numero) {
  const { error } = await supabase.rpc("concluir_ordem", { p_numero: numero });
  if (error) throw new Error(traduzirErro(error.message));
}


// --- 5. MENSAGENS DE ERRO EM PORTUGUÊS ---
function traduzirErro(mensagem) {
  if (/invalid login credentials/i.test(mensagem)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(mensagem)) return "E-mail ainda não confirmado. No Supabase, crie o usuário com a opção Auto Confirm User.";
  if (/failed to fetch|network/i.test(mensagem)) return "Não foi possível falar com o Supabase. Confira sua internet e o endereço do projeto.";
  if (/permission denied/i.test(mensagem)) return "Sem permissão para ler os dados. Confira se o arquivo 01-estrutura.sql foi rodado inteiro.";
  if (/does not exist|could not find/i.test(mensagem)) return "Tabela ou função não encontrada no Supabase. Rode os arquivos SQL da pasta supabase/.";
  return mensagem;
}
