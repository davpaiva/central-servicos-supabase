// ============================================================
// Login.jsx — TELA DE LOGIN
// ============================================================
// O que acontece ao clicar em "Entrar":
//   1. A tela manda e-mail e senha para o Supabase (função entrar)
//   2. O Supabase confere a senha e devolve uma sessão (com um token)
//   3. O App percebe o login sozinho (onAuthStateChange) e mostra o Início
//
// A SENHA É CONFERIDA PELO SUPABASE, nunca aqui. Tudo o que está na
// tela pode ser lido por quem usa o site (F12), então a tela não
// pode guardar segredos.
// ============================================================

import { useState } from "react";
import { entrar } from "../dados.js";

// Usuários de demonstração (criados por você no Supabase; o guia mostra como).
// Se usar outra senha ao criá-los, troque aqui também.
const DEMONSTRACAO = [
  { email: "ana.ribeiro@example.com", senha: "senha123", descricao: "Gestora: vê tudo e pode concluir ordens" },
  { email: "joao.martins@example.com", senha: "senha123", descricao: "Consulta: só visualiza" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();               // impede o navegador de recarregar a página
    setErro("");
    setEnviando(true);
    try {
      await entrar(email, senha);          // deu certo: o App percebe sozinho
    } catch (e) {
      setErro(e.message);
      setEnviando(false);
    }
  }

  function preencher(exemplo) {
    setEmail(exemplo.email);
    setSenha(exemplo.senha);
    setErro("");
  }

  return (
    <div className="login-pagina">
      <section className="login-apresentacao">
        <span className="marca"><span className="marca-icone" />Central de Serviços</span>
        <h1>Acompanhe entrantes, realizadas e pendentes num só lugar.</h1>
        <p>Exemplo de sistema com login: as telas são feitas em React, publicadas no GitHub Pages, e o login e os dados ficam no Supabase.</p>
      </section>

      <section className="login-cartao">
        <h2>Entrar</h2>

        {/* onSubmit: roda a função enviar quando o formulário é enviado */}
        <form onSubmit={enviar} className="login-formulario">
          <label className="campo" htmlFor="login-email">E-mail
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}     // a cada letra, atualiza o estado
              required
            />
          </label>
          <label className="campo" htmlFor="login-senha">Senha
            <input
              id="login-senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </label>

          {erro && <p className="mensagem erro" role="alert">{erro}</p>}

          <button className="botao primario" type="submit" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="demonstracao">
          <p className="legenda">Usuários de demonstração (senha <span className="mono">senha123</span>):</p>
          {DEMONSTRACAO.map(exemplo => (
            <button key={exemplo.email} type="button" className="demo" onClick={() => preencher(exemplo)}>
              <span className="mono">{exemplo.email}</span>
              <span className="legenda">{exemplo.descricao}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
