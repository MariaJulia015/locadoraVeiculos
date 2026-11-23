import { api, criarCrudService } from "./api";
import type { Vistoria } from "../models/Vistoria";

export const vistoriaService = {
  ...criarCrudService<Vistoria>("/vistorias"),
  listarPorLocacao: async (locacaoId: string): Promise<Vistoria[]> =>
    (await api.get<Vistoria[]>("/vistorias")).data.filter((item) => item.locacaoId === locacaoId),
};
