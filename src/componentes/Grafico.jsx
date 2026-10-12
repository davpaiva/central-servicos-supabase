// ============================================================
// Grafico.jsx — LIGA O REACT À BIBLIOTECA DE GRÁFICOS (Chart.js)
// ============================================================
// O Chart.js desenha num <canvas>. O React cria o <canvas>, e o
// useEffect manda o Chart.js desenhar nele depois que ele aparece.
//
//   useRef    -> uma "etiqueta" para achar o <canvas> de verdade
//   useEffect -> roda depois de desenhar; o "return" limpa o gráfico
//                antigo antes de desenhar um novo (quando os dados mudam)
//
// Uso:  <Grafico tipo="line" dados={...} opcoes={...} />
// ============================================================

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

// Ajustes que valem para todos os gráficos
Chart.defaults.font.family = '"IBM Plex Sans", "Segoe UI", Arial, sans-serif';
Chart.defaults.color = "#5b6878";
Chart.defaults.borderColor = "#dde3ea";
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.plugins.legend.position = "bottom";
Chart.defaults.plugins.legend.labels.boxWidth = 12;

export default function Grafico({ tipo, dados, opcoes }) {
  const tela = useRef(null);

  useEffect(() => {
    const grafico = new Chart(tela.current, { type: tipo, data: dados, options: opcoes });
    return () => grafico.destroy();        // limpeza: apaga o gráfico antigo
  }, [tipo, dados, opcoes]);               // redesenha quando algum destes mudar

  return (
    <div className="grafico-caixa">
      <canvas ref={tela} />
    </div>
  );
}
