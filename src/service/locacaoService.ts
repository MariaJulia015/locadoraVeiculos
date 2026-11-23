import { api, criarCrudService } from "./api";
import type { Locacao } from "../models/Locacao";

export const locacaoService = {
  ...criarCrudService<Locacao>("/locacoes"),
  listarPorVeiculo: async (veiculoId: string): Promise<Locacao[]> =>
    (await api.get<Locacao[]>("/locacoes")).data.filter((item) => item.veiculoId === veiculoId),
  listarPorCliente: async (clienteId: string): Promise<Locacao[]> =>
    (await api.get<Locacao[]>("/locacoes")).data.filter((item) => item.clienteId === clienteId),
};
