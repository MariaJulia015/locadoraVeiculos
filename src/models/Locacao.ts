export type StatusLocacao = "ABERTA" | "FINALIZADA" | "CANCELADA";

export interface Locacao {
  id?: string;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal?: string;
  kmRetirada: number;
  kmDevolucao?: number;
  valorTotal: number;
  status: StatusLocacao;
  clienteId: string;
  veiculoId: string;
}

export const locacaoInicial: Locacao = {
  dataRetirada: "",
  dataDevolucaoPrevista: "",
  kmRetirada: 0,
  valorTotal: 0,
  status: "ABERTA",
  clienteId: "",
  veiculoId: "",
};

export const statusLocacaoLabel: Record<StatusLocacao, string> = {
  ABERTA: "Aberta",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

export function calcularDiarias(dataInicio: string, dataFim: string): number {
  const inicio = new Date(`${dataInicio}T00:00:00`).getTime();
  const fim = new Date(`${dataFim}T00:00:00`).getTime();
  const dias = Math.ceil((fim - inicio) / UM_DIA_EM_MS);
  return Math.max(dias, 1);
}

export function calcularValorLocacao(dataInicio: string, dataFim: string, valorDiaria: number): number {
  return calcularDiarias(dataInicio, dataFim) * valorDiaria;
}
