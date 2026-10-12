// ============================================================
// Indicador.jsx — UM "CARTÃO DE NÚMERO" REUTILIZÁVEL
// ============================================================
// Este componente é usado 8 vezes no site (no Início e no Dashboard).
// Escrevemos uma vez e reaproveitamos, mudando só as props:
//
//   <Indicador rotulo="Pendentes" valor="65" detalhe="43 fora do prazo" cor="pendente" />
// ============================================================

export default function Indicador({ rotulo, valor, detalhe, cor = "destaque" }) {
  return (
    <div className="indicador" style={{ "--cor": `var(--${cor})` }}>
      <span className="rotulo">{rotulo}</span>
      <span className="valor">{valor}</span>
      {detalhe && <span className="detalhe">{detalhe}</span>}
    </div>
  );
}
