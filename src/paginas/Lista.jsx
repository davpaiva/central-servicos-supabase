// ============================================================
// Lista.jsx — LISTA DE ORDENS COM FILTROS E AÇÃO "CONCLUIR"
// ============================================================
// Busca, filtros, ordenação e páginas são feitos pelo BANCO DE DADOS
// (Supabase): a tela pede "pendentes, ordenadas por dias, página 2"
// e recebe só as 15 linhas daquela página (veja buscarOrdens em
// dados.js). Com milhões de registros, é assim que sistemas reais
// funcionam.
//
// Quem tem perfil "gestor" vê o botão "Concluir" nas pendentes.
// Mesmo que alguém crie esse botão pelo F12, a função concluir_ordem
// do banco confere o perfil de novo antes de gravar.
// ============================================================

import { useEffect, useState } from "react";
import { buscarOrdens, buscarOpcoes, concluirOrdem } from "../dados.js";
import { numero, data } from "../formatar.js";

const FILTROS_VAZIOS = { busca: "", status: "", regional: "", tipo: "", atrasadas: "" };

// Colunas da tabela: campo usado para ordenar + título
const COLUNAS = [
  { campo: "numero", titulo: "Nº da OS" },
  { campo: "data_entrada", titulo: "Entrada" },
  { campo: "cliente", titulo: "Cliente" },
  { campo: "tipo_servico", titulo: "Tipo de serviço" },
  { campo: "regional", titulo: "Regional" },
  { campo: "prioridade", titulo: "Prioridade" },
  { campo: "status", titulo: "Situação" },
  { campo: "dias", titulo: "Dias / prazo", numero: true },
];

export default function Lista({ usuario, filtrosIniciais }) {
  const [filtros, setFiltros] = useState({ ...FILTROS_VAZIOS, ...filtrosIniciais });
  const [ordenacao, setOrdenacao] = useState({ ordenar: "data_entrada", direcao: "desc" });
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState(null);
  const [opcoes, setOpcoes] = useState({ regionais: [], tipos: [], totalGeral: null });
  const [mensagem, setMensagem] = useState(null);        // { tipo: "ok" | "erro", texto }
  const [confirmando, setConfirmando] = useState(null);  // nº da ordem esperando confirmação
  const [recarregar, setRecarregar] = useState(0);       // muda para forçar nova busca

  const ehGestor = usuario.perfil === "gestor";

  // Opções dos filtros: busca uma vez, quando a página abre
  useEffect(() => {
    buscarOpcoes()
      .then(setOpcoes)
      .catch(e => setMensagem({ tipo: "erro", texto: e.message }));
  }, []);

  // Busca a lista sempre que filtros, ordenação ou página mudarem.
  // O setTimeout espera 250 ms: assim a busca não dispara a cada letra
  // digitada, só quando a pessoa para de digitar.
  useEffect(() => {
    const espera = setTimeout(() => {
      buscarOrdens({ filtros, ...ordenacao, pagina })
        .then(setResultado)
        .catch(e => setMensagem({ tipo: "erro", texto: e.message }));
    }, 250);
    return () => clearTimeout(espera);     // cancela a espera anterior se algo mudar
  }, [filtros, ordenacao, pagina, recarregar]);

  function mudarFiltro(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor });
    setPagina(1);                          // filtro novo -> volta para a página 1
  }

  // Clique no título da coluna: ordena; clicou de novo, inverte
  function ordenarPor(campo) {
    setOrdenacao(atual => ({
      ordenar: campo,
      direcao: atual.ordenar === campo && atual.direcao === "asc" ? "desc" : "asc",
    }));
  }

  async function concluir(numeroOrdem) {
    setConfirmando(null);
    try {
      await concluirOrdem(numeroOrdem);
      setMensagem({ tipo: "ok", texto: `Ordem ${numeroOrdem} concluída e gravada no Supabase.` });
      setRecarregar(n => n + 1);           // busca a lista de novo
    } catch (e) {
      setMensagem({ tipo: "erro", texto: e.message });
    }
  }

  return (
    <>
      <section className="cabecalho-pagina">
        <span className="sobretitulo">Lista</span>
        <h1>Ordens de serviço</h1>
        <p>Busque pelo número ou pelo cliente, filtre e clique no título de uma coluna para ordenar.</p>
      </section>

      {/* ===== FILTROS ===== */}
      <section className="filtros">
        <label className="campo">Buscar
          <input type="search" value={filtros.busca} placeholder="Nº da OS ou cliente"
                 onChange={e => mudarFiltro("busca", e.target.value)} />
        </label>
        <label className="campo">Situação
          <select value={filtros.status} onChange={e => mudarFiltro("status", e.target.value)}>
            <option value="">Todas</option>
            <option value="Pendente">Pendente</option>
            <option value="Realizado">Realizado</option>
          </select>
        </label>
        <label className="campo">Regional
          <select value={filtros.regional} onChange={e => mudarFiltro("regional", e.target.value)}>
            <option value="">Todas</option>
            {opcoes.regionais.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="campo">Tipo de serviço
          <select value={filtros.tipo} onChange={e => mudarFiltro("tipo", e.target.value)}>
            <option value="">Todos</option>
            {opcoes.tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="marcar">
          <input type="checkbox" checked={filtros.atrasadas === "sim"}
                 onChange={e => mudarFiltro("atrasadas", e.target.checked ? "sim" : "")} />
          Só fora do prazo
        </label>
        <button type="button" className="botao" onClick={() => { setFiltros(FILTROS_VAZIOS); setPagina(1); }}>
          Limpar
        </button>
      </section>

      {mensagem && (
        <p className={"mensagem " + mensagem.tipo} role="status">
          {mensagem.texto}
          <button type="button" className="fechar" onClick={() => setMensagem(null)} aria-label="Fechar aviso">×</button>
        </p>
      )}

      {/* ===== TABELA ===== */}
      <section className="cartao">
        <p className="legenda">
          {resultado
            ? `${numero(resultado.total)} de ${numero(opcoes.totalGeral)} ordens`
            : "Carregando…"}
        </p>

        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                {COLUNAS.map(c => (
                  <th key={c.campo} className={c.numero ? "numero" : ""}>
                    <button type="button" onClick={() => ordenarPor(c.campo)}>
                      {c.titulo}
                      <span>{ordenacao.ordenar === c.campo ? (ordenacao.direcao === "asc" ? "▲" : "▼") : ""}</span>
                    </button>
                  </th>
                ))}
                {ehGestor && <th>Ação</th>}
              </tr>
            </thead>
            <tbody>
              {resultado?.ordens.map(o => (
                <tr key={o.numero}>
                  <td className="mono">{o.numero}</td>
                  <td>{data(o.data_entrada)}</td>
                  <td>{o.cliente}</td>
                  <td>{o.tipo_servico}</td>
                  <td>{o.regional}</td>
                  <td>{o.prioridade}</td>
                  <td><Situacao ordem={o} /></td>
                  <td className={"numero" + (o.atrasada ? " atrasado" : "")}>{o.dias} / {o.prazo}</td>
                  {ehGestor && (
                    <td>
                      {o.status === "Pendente" && (
                        confirmando === o.numero
                          ? <span className="confirmar">
                              <button type="button" className="botao pequeno primario" onClick={() => concluir(o.numero)}>Confirmar</button>
                              <button type="button" className="botao pequeno" onClick={() => setConfirmando(null)}>Cancelar</button>
                            </span>
                          : <button type="button" className="botao pequeno" onClick={() => setConfirmando(o.numero)}>Concluir</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {resultado && resultado.ordens.length === 0 && (
                <tr><td colSpan={9} className="legenda">Nenhuma ordem encontrada com esses filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {resultado && (
          <div className="paginacao">
            <span className="legenda">Página {resultado.pagina} de {resultado.totalPaginas}</span>
            <div className="filtros">
              <button type="button" className="botao" disabled={resultado.pagina <= 1}
                      onClick={() => setPagina(resultado.pagina - 1)}>← Anterior</button>
              <button type="button" className="botao" disabled={resultado.pagina >= resultado.totalPaginas}
                      onClick={() => setPagina(resultado.pagina + 1)}>Próxima →</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

// Etiqueta colorida da situação
function Situacao({ ordem }) {
  if (ordem.status === "Realizado") {
    return (
      <span className="etiqueta realizado" title={ordem.concluida_por ? "Concluída por " + ordem.concluida_por : undefined}>
        Realizado{ordem.concluida_por && " ✓"}
      </span>
    );
  }
  return ordem.atrasada
    ? <span className="etiqueta atrasado">Pendente · atrasada</span>
    : <span className="etiqueta pendente">Pendente</span>;
}
