import type { Locacao } from "./Locacao";
import type { Manutencao } from "./Manutencao";

export type SituacaoVeiculo = "DISPONIVEL" | "LOCADO" | "EM_MANUTENCAO";

export interface Veiculo {
  id?: string;
  chassi: string;
  placa: string;
  anoFabricacao: number;
  cor: string;
  kmRodado: number;
  modeloId: string;
}

export const veiculoInicial: Veiculo = {
  chassi: "",
  placa: "",
  anoFabricacao: new Date().getFullYear(),
  cor: "",
  kmRodado: 0,
  modeloId: "",
};

export const situacaoVeiculoLabel: Record<SituacaoVeiculo, string> = {
  DISPONIVEL: "Disponível",
  LOCADO: "Locado",
  EM_MANUTENCAO: "Em manutenção",
};

/**
 * Locado: possui locação com status ABERTA.
 * Em manutenção: possui manutenção registrada para a data de hoje.
 * Disponível: nenhum dos casos acima.
 */
export function calcularSituacaoVeiculo(
  veiculoId: string,
  locacoes: Locacao[],
  manutencoes: Manutencao[],
  hoje: string,
): SituacaoVeiculo {
  if (locacoes.some((locacao) => locacao.veiculoId === veiculoId && locacao.status === "ABERTA")) return "LOCADO";
  if (manutencoes.some((manutencao) => manutencao.veiculoId === veiculoId && manutencao.data === hoje)) {
    return "EM_MANUTENCAO";
  }
  return "DISPONIVEL";
}

export function descreverVeiculo(veiculo: Veiculo, nomeModelo?: string): string {
  return `${veiculo.placa}${nomeModelo ? ` - ${nomeModelo}` : ""}`;
}
