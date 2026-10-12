// ============================================================
// App.jsx — O COMPONENTE PRINCIPAL
// ============================================================
// Mesma ideia da versão com Node: o App guarda quem está logado e
// qual página está aberta. A diferença é QUEM cuida do login:
// agora é o Supabase. Ele avisa o App sempre que alguém entra ou
// sai (onAuthStateChange), e o App redesenha a tela.
//
//   <App>
//     ├─ <AvisoConfiguracao>  (se faltar a ligação com o Supabase)
//     ├─ <Login>              (se ninguém entrou)
//     └─ <Topo> + página      (depois do login)
// ============================================================

import { useEffect, useState } from "react";
import { supabase, configurado } from "./supabase.js";
import { buscarPerfil, sair } from "./dados.js";
import Topo from "./componentes/Topo.jsx";
import Login from "./paginas/Login.jsx";
import Inicio from "./paginas/Inicio.jsx";
import Dashboard from "./paginas/Dashboard.jsx";
import Lista from "./paginas/Lista.jsx";

export default function App() {
  if (!configurado) return <AvisoConfiguracao />;
  return <Sistema />;
}

function Sistema() {
  const [sessao, setSessao] = useState(undefined);       // undefined = ainda verificando
  const [usuario, setUsuario] = useState(null);           // { nome, perfil, email }
  const [erroPerfil, setErroPerfil] = useState("");
  const [pagina, setPagina] = useState("inicio");
  const [filtrosLista, setFiltrosLista] = useState({});

  // 1. Ao abrir: pergunta ao Supabase se já existe login salvo,
  //    e passa a "escutar" entradas e saídas.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
    });
    return () => data.subscription.unsubscribe();        // para de escutar ao fechar
  }, []);

  // 2. Quando muda quem está logado: busca nome e perfil na tabela "perfis"
  const idUsuario = sessao?.user?.id;
  useEffect(() => {
    setUsuario(null);
    setErroPerfil("");
    if (!idUsuario) return;
    buscarPerfil(idUsuario)
      .then(perfil => {
        setUsuario({ ...perfil, email: sessao.user.email });
        setPagina("inicio");
      })
      .catch(e => setErroPerfil(e.message));
  }, [idUsuario]);

  function irPara(nome, filtros = {}) {
    setFiltrosLista(filtros);
    setPagina(nome);
    window.scrollTo(0, 0);
  }

  if (sessao === undefined) return <p className="carregando">Carregando…</p>;
  if (!sessao) return <Login />;
  if (erroPerfil) {
    return (
      <div className="carregando">
        <p className="mensagem erro">{erroPerfil}</p>
        <button type="button" className="botao" onClick={sair}>Voltar ao login</button>
      </div>
    );
  }
  if (!usuario) return <p className="carregando">Carregando seu perfil…</p>;

  return (
    <>
      <Topo usuario={usuario} pagina={pagina} irPara={irPara} aoSair={sair} />
      <main className="conteudo">
        {pagina === "inicio" && <Inicio usuario={usuario} irPara={irPara} />}
        {pagina === "dashboard" && <Dashboard irPara={irPara} />}
        {pagina === "lista" && (
          <Lista usuario={usuario} filtrosIniciais={filtrosLista} key={JSON.stringify(filtrosLista)} />
        )}
      </main>
      <footer className="rodape">Site de exemplo para aprender · dados inventados · dados no Supabase</footer>
    </>
  );
}

// Aparece se o site foi montado sem o endereço e a chave do Supabase
function AvisoConfiguracao() {
  return (
    <div className="carregando">
      <p className="mensagem erro">
        Falta ligar o site ao Supabase. Cadastre as variáveis VITE_SUPABASE_URL e
        VITE_SUPABASE_PUBLISHABLE_KEY (no GitHub: Settings › Secrets and variables › Actions › Variables)
        e publique de novo.
      </p>
    </div>
  );
}
