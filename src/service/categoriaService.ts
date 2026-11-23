import { criarCrudService } from "./api";
import type { Categoria } from "../models/Categoria";

export const categoriaService = {
  ...criarCrudService<Categoria>("/categorias"),
};
