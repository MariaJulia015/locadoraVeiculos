export interface Cliente {
  id?: string;
  nome: string;
  cpf: string;
  cnh: string;
  validadeCnh: string;
  telefone: string;
  email: string;
  endereco: string;
}

export const clienteInicial: Cliente = {
  nome: "",
  cpf: "",
  cnh: "",
  validadeCnh: "",
  telefone: "",
  email: "",
  endereco: "",
};

export function cnhVencida(cliente: Cliente, dataReferencia: string): boolean {
  return cliente.validadeCnh < dataReferencia;
}

export type ErrosCliente = Partial<Record<keyof Cliente, string>>;

/** Valida os campos obrigatórios e a regra RF06 (CPF e CNH não podem se repetir). */
export function validarCliente(dados: Cliente, outrosClientes: Cliente[]): ErrosCliente {
  const erros: ErrosCliente = {};
  if (!dados.nome) erros.nome = "Informe o nome.";
  if (!dados.cpf) erros.cpf = "Informe o CPF.";
  if (!dados.cnh) erros.cnh = "Informe o número da CNH.";
  if (!dados.validadeCnh) erros.validadeCnh = "Informe a validade da CNH.";
  if (!dados.telefone) erros.telefone = "Informe o telefone.";
  if (!dados.email) erros.email = "Informe o e-mail.";
  if (!dados.endereco) erros.endereco = "Informe o endereço.";
  if (dados.cpf && outrosClientes.some((outro) => outro.cpf === dados.cpf)) erros.cpf = "Já existe um cliente com este CPF.";
  if (dados.cnh && outrosClientes.some((outro) => outro.cnh === dados.cnh)) erros.cnh = "Já existe um cliente com esta CNH.";
  return erros;
}

/** Remove espaços sobrando antes de salvar. */
export function limparCliente(cliente: Cliente): Cliente {
  return {
    ...cliente,
    nome: cliente.nome.trim(),
    cpf: cliente.cpf.trim(),
    cnh: cliente.cnh.trim(),
    telefone: cliente.telefone.trim(),
    email: cliente.email.trim(),
    endereco: cliente.endereco.trim(),
  };
}
