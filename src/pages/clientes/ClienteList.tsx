import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Table, type Column } from "../../components/Table";
import { cnhVencida, type Cliente } from "../../models/Cliente";
import { dataHoje, formatarData, mensagemDeErro } from "../../models/formatadores";
import { clienteService } from "../../service/clienteService";
import { locacaoService } from "../../service/locacaoService";

export const ClienteList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);
  const [sucesso, setSucesso] = useState<string>((location.state as { mensagem?: string } | null)?.mensagem ?? "");
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setClientes(await clienteService.listar());
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const excluir = async () => {
    if (!clienteParaExcluir?.id) return;
    const cliente = clienteParaExcluir;
    setClienteParaExcluir(null);
    try {
      const locacoes = await locacaoService.listarPorCliente(cliente.id!);
      if (locacoes.length > 0) {
        setSucesso("");
        setErro(`Não é possível excluir o cliente "${cliente.nome}": existem ${locacoes.length} locação(ões) vinculadas a ele.`);
        return;
      }
      await clienteService.excluir(cliente.id!);
      setErro("");
      setSucesso(`Cliente "${cliente.nome}" excluído com sucesso.`);
      carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  const hoje = dataHoje();

  const columns: Column<Cliente>[] = [
    { header: "Nome", render: (cliente) => cliente.nome },
    { header: "CPF", render: (cliente) => cliente.cpf },
    { header: "CNH", render: (cliente) => cliente.cnh },
    {
      header: "Validade da CNH",
      render: (cliente) =>
        cnhVencida(cliente, hoje) ? (
          <span className="text-danger fw-semibold">{formatarData(cliente.validadeCnh)} (vencida)</span>
        ) : (
          formatarData(cliente.validadeCnh)
        ),
    },
    { header: "Telefone", render: (cliente) => cliente.telefone },
    { header: "E-mail", render: (cliente) => cliente.email },
  ];

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Clientes</h1>
        <Button label="Novo cliente" onClick={() => navigate("/clientes/novo")} />
      </div>

      <Alert type="success" message={sucesso} onClose={() => setSucesso("")} />
      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      <Table
        columns={columns}
        data={clientes}
        onEdit={(cliente) => navigate(`/clientes/${cliente.id}`)}
        onDelete={(cliente) => setClienteParaExcluir(cliente)}
      />

      <Modal
        show={clienteParaExcluir !== null}
        title="Excluir cliente"
        confirmLabel="Excluir"
        onClose={() => setClienteParaExcluir(null)}
        onConfirm={excluir}
      >
        Deseja realmente excluir o cliente <strong>{clienteParaExcluir?.nome}</strong>?
      </Modal>
    </div>
  );
}
