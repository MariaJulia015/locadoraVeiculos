import { api, criarCrudService } from "./api";
import type { Contrato } from "../models/Contrato";

export const contratoService = {
  ...criarCrudService<Contrato>("/contratos"),
  listarPorLocacao: async (locacaoId: string): Promise<Contrato[]> =>
    (await api.get<Contrato[]>("/contratos")).data.filter((item) => item.locacaoId === locacaoId),
};
