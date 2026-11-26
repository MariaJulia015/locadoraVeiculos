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

/** Soma dias a uma data aaaa-mm-dd e devolve no mesmo formato. */
export function somarDias(data: string, dias: number): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  const resultado = new Date(ano, mes - 1, dia + dias);
  const novoMes = String(resultado.getMonth() + 1).padStart(2, "0");
  const novoDia = String(resultado.getDate()).padStart(2, "0");
  return `${resultado.getFullYear()}-${novoMes}-${novoDia}`;
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error) return `Não foi possível concluir a operação: ${erro.message}`;
  return "Não foi possível concluir a operação.";
}
