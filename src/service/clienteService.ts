import { criarCrudService } from "./api";
import type { Cliente } from "../models/Cliente";

export const clienteService = {
  ...criarCrudService<Cliente>("/clientes"),
};
