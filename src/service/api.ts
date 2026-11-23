import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

export interface CrudService<T> {
  listar: () => Promise<T[]>;
  buscarPorId: (id: string) => Promise<T>;
  criar: (obj: T) => Promise<T>;
  atualizar: (id: string, obj: T) => Promise<T>;
  excluir: (id: string) => Promise<void>;
}

/**
 * Cria as funções básicas de CRUD para um recurso do JSON Server.
 * Ex.: criarCrudService<Marca>("/marcas")
 */
export function criarCrudService<T extends { id?: string }>(recurso: string): CrudService<T> {
  return {
    listar: async (): Promise<T[]> => (await api.get<T[]>(recurso)).data,
    buscarPorId: async (id: string): Promise<T> => (await api.get<T>(`${recurso}/${id}`)).data,
    criar: async (obj: T): Promise<T> => (await api.post<T>(recurso, obj)).data,
    atualizar: async (id: string, obj: T): Promise<T> => {
      const dados: T = { ...obj, id };
      return (await api.put<T>(`${recurso}/${id}`, dados)).data;
    },
    excluir: async (id: string): Promise<void> => {
      await api.delete(`${recurso}/${id}`);
    },
  };
}
