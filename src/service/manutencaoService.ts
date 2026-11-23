import { api, criarCrudService } from "./api";
import type { Manutencao } from "../models/Manutencao";

export const manutencaoService = {
  ...criarCrudService<Manutencao>("/manutencoes"),
  listarPorVeiculo: async (veiculoId: string): Promise<Manutencao[]> =>
    (await api.get<Manutencao[]>("/manutencoes")).data.filter((item) => item.veiculoId === veiculoId),
};
