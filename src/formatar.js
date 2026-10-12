// ============================================================
// formatar.js — PEQUENAS FUNÇÕES PARA MOSTRAR NÚMEROS E DATAS
// ============================================================

// 1234 -> "1.234"
export function numero(n) {
  return n == null ? "–" : n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

// 0.873 -> "87,3%"
export function percentual(fracao) {
  return fracao == null ? "–" : (fracao * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
}

// "2026-09-30" -> "30/09/2026"
export function data(iso) {
  if (!iso) return "–";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

// "2026-04" -> "abr/26"
export function mes(chave) {
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [ano, m] = chave.split("-");
  return nomes[Number(m) - 1] + "/" + ano.slice(2);
}
