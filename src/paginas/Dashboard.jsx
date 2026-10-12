// ============================================================
// Dashboard.jsx — INDICADORES E GRÁFICOS
// ============================================================
// As ordens são lidas do Supabase UMA vez, quando a página abre.
// Os filtros e as contas acontecem no navegador (calculos.js):
//
//   escolheu um filtro -> estado "filtros" muda -> o React redesenha
//   -> calcularDashboard roda de novo com os filtros novos
//
// useMemo guarda o resultado da conta e só refaz quando "ordens"
// ou "filtros" mudam.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { buscarOrdensParaDashboard } from "../dados.js";
import { calcularDashboard } from "../calculos.js";
import { numero, percentual, mes, data } from "../formatar.js";
import Indicador from "../componentes/Indicador.jsx";
import Grafico from "../componentes/Grafico.jsx";

// Cores (as mesmas do estilo.css)
const COR = {
  destaque: "#1f5fbf",
  realizado: "#1e8a5a",
  pendente: "#c98300",
  atrasado: "#c8423b",
};
const CORES_TIPOS = ["#1f5fbf", "#6c9be0", "#1e8a5a", "#c98300", "#8a5cc7", "#8a96a5"];

const SEM_FILTRO = { regional: "", tipo: "", prioridade: "" };

export default function Dashboard({ irPara }) {
  const [filtros, setFiltros] = useState(SEM_FILTRO);
  const [ordens, setOrdens] = useState(null);
  const [erro, setErro] = useState("");

  // [] = busca as ordens uma vez só, quando a página abre
  useEffect(() => {
    buscarOrdensParaDashboard()
      .then(setOrdens)
      .catch(e => setErro(e.message));
  }, []);

  // Refaz as contas só quando as ordens ou os filtros mudam
  const dados = useMemo(
    () => (ordens ? calcularDashboard(ordens, filtros) : null),
    [ordens, filtros]
  );

  // Muda um filtro só, mantendo os outros (...filtros = "copia os outros")
  function mudarFiltro(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor });
  }

  if (erro) return <p className="mensagem erro">{erro}</p>;
  if (!dados) return <p className="legenda">Carregando dados…</p>;

  const ind = dados.indicadores;
  const rotulosMeses = dados.meses.map(mes);

  return (
    <>
      <section className="cabecalho-pagina">
        <span className="sobretitulo">Dashboard</span>
        <h1>Entrantes, realizadas e pendentes</h1>
        <p>Os filtros mudam os indicadores e os 4 gráficos ao mesmo tempo. Clique numa barra de regional para abrir a lista.</p>
      </section>

      {/* ===== FILTROS ===== */}
      <section className="filtros">
        <Seletor rotulo="Regional" valor={filtros.regional} opcoes={dados.opcoes.regionais}
                 vazio="Todas" aoMudar={v => mudarFiltro("regional", v)} />
        <Seletor rotulo="Tipo de serviço" valor={filtros.tipo} opcoes={dados.opcoes.tipos}
                 vazio="Todos" aoMudar={v => mudarFiltro("tipo", v)} />
        <Seletor rotulo="Prioridade" valor={filtros.prioridade} opcoes={["Alta", "Média", "Baixa"]}
                 vazio="Todas" aoMudar={v => mudarFiltro("prioridade", v)} />
        <button type="button" className="botao" onClick={() => setFiltros(SEM_FILTRO)}>Limpar filtros</button>
      </section>

      {/* ===== INDICADORES ===== */}
      <section className="indicadores">
        <Indicador rotulo="Entrantes" valor={numero(ind.entrantes)} detalhe="ordens abertas" />
        <Indicador rotulo="Realizadas" valor={numero(ind.realizadas)} cor="realizado"
                   detalhe={ind.entrantes ? percentual(ind.realizadas / ind.entrantes) + " das entrantes" : ""} />
        <Indicador rotulo="Pendentes" valor={numero(ind.pendentes)} cor="pendente"
                   detalhe={`${ind.pendentesAtrasadas} fora do prazo`} />
        <Indicador rotulo="Realizadas no prazo" valor={percentual(ind.percentualNoPrazo)} cor="realizado"
                   detalhe="das ordens concluídas" />
        <Indicador rotulo="Tempo médio" valor={numero(ind.tempoMedio)} cor="texto-2"
                   detalhe="dias para concluir" />
      </section>

      {/* ===== GRÁFICOS ===== */}
      <section className="graficos">
        <Cartao titulo="Entrantes × realizadas por mês" legenda="Linhas: evolução no tempo.">
          <Grafico
            tipo="line"
            dados={{
              labels: rotulosMeses,
              datasets: [
                { label: "Entrantes", data: dados.evolucao.entrantes, borderColor: COR.destaque, backgroundColor: COR.destaque, tension: 0.3 },
                { label: "Realizadas", data: dados.evolucao.realizadas, borderColor: COR.realizado, backgroundColor: COR.realizado, tension: 0.3 },
              ],
            }}
            opcoes={{ interaction: { mode: "index", intersect: false }, scales: { y: { beginAtZero: true } } }}
          />
        </Cartao>

        <Cartao titulo="Realizadas dentro e fora do prazo" legenda="Barras empilhadas: o total do mês e suas partes.">
          <Grafico
            tipo="bar"
            dados={{
              labels: rotulosMeses,
              datasets: [
                { label: "No prazo", data: dados.prazo.noPrazo, backgroundColor: COR.realizado },
                { label: "Fora do prazo", data: dados.prazo.fora, backgroundColor: COR.atrasado },
              ],
            }}
            opcoes={{
              interaction: { mode: "index", intersect: false },
              scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } },
            }}
          />
        </Cartao>

        <Cartao titulo="Entrantes por tipo de serviço" legenda="Rosca: a fatia de cada tipo no total.">
          <Grafico
            tipo="doughnut"
            dados={{
              labels: dados.tipos.nomes,
              datasets: [{ data: dados.tipos.valores, backgroundColor: CORES_TIPOS, borderColor: "#ffffff", borderWidth: 2 }],
            }}
            opcoes={{ cutout: "62%", plugins: { legend: { position: window.innerWidth < 600 ? "bottom" : "right" } } }}
          />
        </Cartao>

        <Cartao titulo="Pendentes por regional" legenda="Barras horizontais: comparar categorias. Clique numa barra.">
          <Grafico
            tipo="bar"
            dados={{
              labels: dados.regionais.nomes,
              datasets: [
                { label: "Fora do prazo", data: dados.regionais.atrasadas, backgroundColor: COR.atrasado },
                { label: "No prazo", data: dados.regionais.noPrazo, backgroundColor: COR.pendente },
              ],
            }}
            opcoes={{
              indexAxis: "y",
              interaction: { mode: "index", intersect: false },
              scales: { x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }, y: { stacked: true, grid: { display: false } } },
              // Clique numa barra -> abre a lista filtrada por aquela regional
              onClick: (evento, elementos) => {
                if (elementos.length === 0) return;
                const regional = dados.regionais.nomes[elementos[0].index];
                irPara("lista", { status: "Pendente", regional });
              },
              onHover: (evento, elementos) => {
                evento.native.target.style.cursor = elementos.length ? "pointer" : "default";
              },
            }}
          />
        </Cartao>
      </section>

      <p className="legenda">Situação em {data(dados.dataReferencia)} · dados lidos do Supabase, contas feitas no navegador</p>
    </>
  );
}


// ---- Componentes pequenos usados só nesta página ----

// Uma caixa de seleção (<select>) com a opção "Todas" no começo
function Seletor({ rotulo, valor, opcoes, vazio, aoMudar }) {
  return (
    <label className="campo">{rotulo}
      <select value={valor} onChange={e => aoMudar(e.target.value)}>
        <option value="">{vazio}</option>
        {opcoes.map(opcao => <option key={opcao} value={opcao}>{opcao}</option>)}
      </select>
    </label>
  );
}

// O cartão branco em volta de cada gráfico. "children" = o que vai dentro.
function Cartao({ titulo, legenda, children }) {
  return (
    <div className="cartao">
      <h2>{titulo}</h2>
      <p className="legenda">{legenda}</p>
      {children}
    </div>
  );
}
