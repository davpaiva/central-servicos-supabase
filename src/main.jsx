// ============================================================
// main.jsx — PONTO DE PARTIDA DO REACT
// ============================================================
// Pega a caixa vazia <div id="raiz"> do index.html e manda o React
// desenhar o componente <App /> dentro dela. Tudo começa aqui.
// ============================================================

import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./estilo.css";

createRoot(document.getElementById("raiz")).render(<App />);
