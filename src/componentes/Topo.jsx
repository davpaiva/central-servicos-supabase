// ============================================================
// Topo.jsx — CABEÇALHO COM MENU, NOME DA PESSOA E BOTÃO SAIR
// ============================================================
// Recebe "props" (as informações que o componente pai manda):
//   usuario -> { nome, perfil }
//   pagina  -> qual página está aberta (para destacar no menu)
//   irPara  -> função para trocar de página
//   aoSair  -> função para sair
// ============================================================

const PAGINAS = [
  { id: "inicio", nome: "Início" },
  { id: "dashboard", nome: "Dashboard" },
  { id: "lista", nome: "Lista de ordens" },
];

export default function Topo({ usuario, pagina, irPara, aoSair }) {
  return (
    <header className="topo">
      <div className="topo-dentro">
        <span className="marca"><span className="marca-icone" />Central de Serviços</span>

        <nav className="menu">
          {/* .map() cria um botão para cada item da lista PAGINAS */}
          {PAGINAS.map(p => (
            <button
              key={p.id}
              type="button"
              className={p.id === pagina ? "ativo" : ""}
              onClick={() => irPara(p.id)}
            >
              {p.nome}
            </button>
          ))}
        </nav>

        <div className="usuario">
          <span className="usuario-nome">
            {usuario.nome}
            <span className={"perfil perfil-" + usuario.perfil}>{usuario.perfil}</span>
          </span>
          <button type="button" className="botao" onClick={aoSair}>Sair</button>
        </div>
      </div>
    </header>
  );
}
