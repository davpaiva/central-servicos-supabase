// ============================================================
// calculos.js — AS CONTAS DO DASHBOARD (feitas no navegador)
// ============================================================
// Na versão com Node, estas contas ficavam no servidor. Aqui o
// Supabase entrega as ordens já com "dias" e "atrasada" calculados
// (pela view ordens_detalhe), e este arquivo agrupa por mês, por
// tipo e por regional para os gráficos.
// ============================================================

export const DATA_REFERENCIA = "2026-09-30";   // "hoje" dos dados de exemplo

function contarPor(lista, campo) {
  const contagem = {};
  for (const item of lista) {
    const chave = item[campo];
    if (chave) contagem[chave] = (contagem[chave] || 0) + 1;
  }
  return contagem;
}

const unicos = (lista, campo) => [...new Set(lista.map(o => o[campo]))].sort();
const mes = data => (data ? data.slice(0, 7) : null);    // "2026-04-15" -> "2026-04"

export function calcularDashboard(todas, filtros) {
  const ordens = todas
    .filter(o =>
      (!filtros.regional   || o.regional     === filtros.regional) &&
      (!filtros.tipo       || o.tipo_servico === filtros.tipo) &&
      (!filtros.prioridade || o.prioridade   === filtros.prioridade))
    .map(o => ({ ...o, mesEntrada: mes(o.data_entrada), mesConclusao: mes(o.data_conclusao) }));

  const realizadas = ordens.filter(o => o.status === "Realizado");
  const pendentes  = ordens.filter(o => o.status === "Pendente");
  const meses      = [...new Set(todas.map(o => mes(o.data_entrada)))].sort();

  const porMes = (lista, campo) => {
    const c = contarPor(lista, campo);
    return meses.map(m => c[m] || 0);
  };

  const totalPorTipo = contarPor(ordens, "tipo_servico");
  const tipos = Object.keys(totalPorTipo).sort((a, b) => totalPorTipo[b] - totalPorTipo[a]);

  const pendPorRegional  = contarPor(pendentes, "regional");
  const atrasPorRegional = contarPor(pendentes.filter(o => o.atrasada), "regional");
  const regionais = unicos(todas, "regional").sort((a, b) => (pendPorRegional[b] || 0) - (pendPorRegional[a] || 0));

  const somaDias = realizadas.reduce((soma, o) => soma + o.dias, 0);

  return {
    indicadores: {
      entrantes: ordens.length,
      realizadas: realizadas.length,
      pendentes: pendentes.length,
      pendentesAtrasadas: pendentes.filter(o => o.atrasada).length,
      percentualNoPrazo: realizadas.length ? realizadas.filter(o => !o.atrasada).length / realizadas.length : null,
      tempoMedio: realizadas.length ? somaDias / realizadas.length : null,
    },
    meses,
    evolucao: { entrantes: porMes(ordens, "mesEntrada"), realizadas: porMes(realizadas, "mesConclusao") },
    prazo: {
      noPrazo: porMes(realizadas.filter(o => !o.atrasada), "mesConclusao"),
      fora: porMes(realizadas.filter(o => o.atrasada), "mesConclusao"),
    },
    tipos: { nomes: tipos, valores: tipos.map(t => totalPorTipo[t]) },
    regionais: {
      nomes: regionais,
      atrasadas: regionais.map(r => atrasPorRegional[r] || 0),
      noPrazo: regionais.map(r => (pendPorRegional[r] || 0) - (atrasPorRegional[r] || 0)),
    },
    opcoes: { regionais: unicos(todas, "regional"), tipos: unicos(todas, "tipo_servico") },
    dataReferencia: DATA_REFERENCIA,
  };
}
