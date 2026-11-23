import { criarCrudService } from "./api";
import type { Modelo } from "../models/Modelo";

export const modeloService = {
  ...criarCrudService<Modelo>("/modelos"),
};
