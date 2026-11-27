export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Converte "2026-11-23" (ou "2026-11-23T10:00") para "23/11/2026". */
export function formatarData(data?: string): string {
  if (!data) return "-";
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Data de hoje no formato aaaa-mm-dd, no fuso local. */
export function dataHoje(): string {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error) return `Não foi possível concluir a operação: ${erro.message}`;
  return "Não foi possível concluir a operação.";
}
