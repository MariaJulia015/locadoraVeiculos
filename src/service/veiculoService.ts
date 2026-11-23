import { api, criarCrudService } from "./api";
import type { Veiculo } from "../models/Veiculo";

export const veiculoService = {
  ...criarCrudService<Veiculo>("/veiculos"),
  atualizarKm: async (id: string, kmRodado: number): Promise<Veiculo> =>
    (await api.patch<Veiculo>(`/veiculos/${id}`, { kmRodado })).data,
};
