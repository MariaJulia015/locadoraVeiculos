import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { clienteInicial, type Cliente } from "../../models/Cliente";
import { mensagemDeErro } from "../../models/formatadores";
import { clienteService } from "../../service/clienteService";

export const ClienteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente>(clienteInicial);
  const [erros, setErros] = useState<Partial<Record<keyof Cliente, string>>>({});
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) return;
    clienteService
      .buscarPorId(id)
      .then(setCliente)
      .catch((e: unknown) => setErro(mensagemDeErro(e)));
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCliente((atual) => ({ ...atual, [name]: value }));
  };

  const validar = async (dados: Cliente): Promise<boolean> => {
    const novosErros: Partial<Record<keyof Cliente, string>> = {};
    if (!dados.nome) novosErros.nome = "Informe o nome.";
    if (!dados.cpf) novosErros.cpf = "Informe o CPF.";
    if (!dados.cnh) novosErros.cnh = "Informe o número da CNH.";
    if (!dados.validadeCnh) novosErros.validadeCnh = "Informe a validade da CNH.";
    if (!dados.telefone) novosErros.telefone = "Informe o telefone.";
    if (!dados.email) novosErros.email = "Informe o e-mail.";
    if (!dados.endereco) novosErros.endereco = "Informe o endereço.";

    // RF06: CPF e CNH não podem se repetir
    const outros = (await clienteService.listar()).filter((outro) => outro.id !== id);
    if (dados.cpf && outros.some((outro) => outro.cpf === dados.cpf)) novosErros.cpf = "Já existe um cliente com este CPF.";
    if (dados.cnh && outros.some((outro) => outro.cnh === dados.cnh)) novosErros.cnh = "Já existe um cliente com esta CNH.";

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const dados: Cliente = {
        ...cliente,
        nome: cliente.nome.trim(),
        cpf: cliente.cpf.trim(),
        cnh: cliente.cnh.trim(),
        telefone: cliente.telefone.trim(),
        email: cliente.email.trim(),
        endereco: cliente.endereco.trim(),
      };
      if (!(await validar(dados))) return;
      if (id) await clienteService.atualizar(id, dados);
      else await clienteService.criar(dados);
      navigate("/clientes", { state: { mensagem: `Cliente "${dados.nome}" salvo com sucesso.` } });
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <h1 className="h3 mb-3">{id ? "Editar cliente" : "Novo cliente"}</h1>
      <Alert type="danger" message={erro} onClose={() => setErro("")} />
      <form onSubmit={salvar} noValidate className="card card-body shadow-sm">
        <div className="row">
          <div className="col-md-6">
            <Input label="Nome" name="nome" value={cliente.nome} onChange={handleChange} error={erros.nome} />
          </div>
          <div className="col-md-6">
            <Input
              label="CPF"
              name="cpf"
              value={cliente.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
              error={erros.cpf}
            />
          </div>
          <div className="col-md-6">
            <Input label="Número da CNH" name="cnh" value={cliente.cnh} onChange={handleChange} error={erros.cnh} />
          </div>
          <div className="col-md-6">
            <Input
              label="Validade da CNH"
              name="validadeCnh"
              type="date"
              value={cliente.validadeCnh}
              onChange={handleChange}
              error={erros.validadeCnh}
            />
          </div>
          <div className="col-md-6">
            <Input
              label="Telefone"
              name="telefone"
              type="tel"
              value={cliente.telefone}
              onChange={handleChange}
              placeholder="(62) 99999-9999"
              error={erros.telefone}
            />
          </div>
          <div className="col-md-6">
            <Input label="E-mail" name="email" type="email" value={cliente.email} onChange={handleChange} error={erros.email} />
          </div>
          <div className="col-12">
            <Input label="Endereço" name="endereco" value={cliente.endereco} onChange={handleChange} error={erros.endereco} />
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-end">
          <Button label="Cancelar" variant="secondary" onClick={() => navigate("/clientes")} />
          <Button label="Salvar" type="submit" variant="success" />
        </div>
      </form>
    </div>
  );
}
