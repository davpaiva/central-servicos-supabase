// ============================================================
// Inicio.jsx — PÁGINA INICIAL (depois do login)
// ============================================================
// Busca as ordens no Supabase quando a página aparece e calcula
// os indicadores (calculos.js).
// Enquanto os dados não chegam, "dados" é null e mostramos "–".
// ============================================================

import { useEffect, useState } from "react";
import { buscarOrdensParaDashboard } from "../dados.js";
import { calcularDashboard } from "../calculos.js";
import { numero, data } from "../formatar.js";
import Indicador from "../componentes/Indicador.jsx";

export default function Inicio({ usuario, irPara }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  // [] no final = roda uma vez só, quando a página abre
  useEffect(() => {
    buscarOrdensParaDashboard()
      .then(ordens => setDados(calcularDashboard(ordens, {})))
      .catch(e => setErro(e.message));
  }, []);

  const ind = dados?.indicadores;          // "?." = só lê se dados não for null
  const primeiroNome = usuario.nome.split(" ")[0];

  return (
    <>
      <section className="cabecalho-pagina">
        <span className="sobretitulo">Início</span>
        <h1>Olá, {primeiroNome}</h1>
        <p>
          {usuario.perfil === "gestor"
            ? "Seu perfil é gestor: você vê todos os dados e pode concluir ordens pendentes na lista."
            : "Seu perfil é consulta: você vê todos os dados, mas não altera nenhuma ordem."}
        </p>
      </section>

      {erro && <p className="mensagem erro">{erro}</p>}

      <section className="indicadores">
        <Indicador rotulo="Entrantes" valor={numero(ind?.entrantes)} detalhe="ordens abertas no período" />
        <Indicador rotulo="Realizadas" valor={numero(ind?.realizadas)} detalhe="concluídas" cor="realizado" />
        <Indicador
          rotulo="Pendentes"
          valor={numero(ind?.pendentes)}
          detalhe={ind ? `${ind.pendentesAtrasadas} fora do prazo` : ""}
          cor="pendente"
        />
      </section>
      {dados && <p className="legenda">Situação em {data(dados.dataReferencia)} · dados lidos do Supabase</p>}

      <section className="atalhos">
        <button type="button" className="atalho" onClick={() => irPara("dashboard")}>
          <h2>Dashboard</h2>
          <p>Indicadores e 4 gráficos, com filtros por regional, tipo de serviço e prioridade.</p>
          <span className="ir">Abrir dashboard →</span>
        </button>
        <button type="button" className="atalho" onClick={() => irPara("lista")}>
          <h2>Lista de ordens</h2>
          <p>Busca, filtros e ordenação feitos pelo banco de dados.{usuario.perfil === "gestor" && " Aqui você conclui ordens pendentes."}</p>
          <span className="ir">Abrir lista →</span>
        </button>
        <button type="button" className="atalho" onClick={() => irPara("lista", { status: "Pendente", atrasadas: "sim" })}>
          <h2>Pendências atrasadas</h2>
          <p>Atalho para a lista já filtrada: ordens pendentes que passaram do prazo.</p>
          <span className="ir">Ver atrasadas →</span>
        </button>
      </section>
    </>
  );
}
