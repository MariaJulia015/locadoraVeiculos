import { api, criarCrudService } from "./api";
import type { NotaFiscal } from "../models/NotaFiscal";

export const notaFiscalService = {
  ...criarCrudService<NotaFiscal>("/notasFiscais"),
  listarPorLocacao: async (locacaoId: string): Promise<NotaFiscal[]> =>
    (await api.get<NotaFiscal[]>("/notasFiscais")).data.filter((item) => item.locacaoId === locacaoId),
};
