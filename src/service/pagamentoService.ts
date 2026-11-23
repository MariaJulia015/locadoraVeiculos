import { api, criarCrudService } from "./api";
import type { Pagamento } from "../models/Pagamento";

export const pagamentoService = {
  ...criarCrudService<Pagamento>("/pagamentos"),
  listarPorLocacao: async (locacaoId: string): Promise<Pagamento[]> =>
    (await api.get<Pagamento[]>("/pagamentos")).data.filter((item) => item.locacaoId === locacaoId),
};
