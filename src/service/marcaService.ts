import { criarCrudService } from "./api";
import type { Marca } from "../models/Marca";

export const marcaService = {
  ...criarCrudService<Marca>("/marcas"),
};
