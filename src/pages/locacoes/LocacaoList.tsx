import { useEffect, useState, type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Select } from "../../components/Select";
import { Table, type Column } from "../../components/Table";
import type { Cliente } from "../../models/Cliente";
import { statusLocacaoLabel, type Locacao, type StatusLocacao } from "../../models/Locacao";
import type { Modelo } from "../../models/Modelo";
import { descreverVeiculo, type Veiculo } from "../../models/Veiculo";
import { formatarData, formatarMoeda, mensagemDeErro } from "../../models/formatadores";
import { clienteService } from "../../service/clienteService";
import { locacaoService } from "../../service/locacaoService";
import { modeloService } from "../../service/modeloService";
import { veiculoService } from "../../service/veiculoService";

const statusDisponiveis = Object.keys(statusLocacaoLabel) as StatusLocacao[];

const corStatus: Record<StatusLocacao, string> = {
  ABERTA: "bg-primary",
  FINALIZADA: "bg-success",
  CANCELADA: "bg-secondary",
};

export const LocacaoList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [sucesso, setSucesso] = useState<string>((location.state as { mensagem?: string } | null)?.mensagem ?? "");
  const [erro, setErro] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusLocacao | "">("");
  const [filtroCliente, setFiltroCliente] = useState("");

  useEffect(() => {
    Promise.all([locacaoService.listar(), clienteService.listar(), veiculoService.listar(), modeloService.listar()])
      .then(([listaLocacoes, listaClientes, listaVeiculos, listaModelos]) => {
        setLocacoes(listaLocacoes);
        setClientes(listaClientes);
        setVeiculos(listaVeiculos);
        setModelos(listaModelos);
      })
      .catch((e: unknown) => setErro(mensagemDeErro(e)));
  }, []);

  const nomeVeiculo = (veiculoId: string): string => {
    const veiculo = veiculos.find((item) => item.id === veiculoId);
    if (!veiculo) return "-";
    return descreverVeiculo(veiculo, modelos.find((modelo) => modelo.id === veiculo.modeloId)?.nome);
  };

  // RF14: filtro por status e por cliente
  const locacoesFiltradas = locacoes
    .filter((locacao) => !filtroStatus || locacao.status === filtroStatus)
    .filter((locacao) => !filtroCliente || locacao.clienteId === filtroCliente)
    .sort((a, b) => b.dataRetirada.localeCompare(a.dataRetirada));

  const columns: Column<Locacao>[] = [
    { header: "Cliente", render: (locacao) => clientes.find((cliente) => cliente.id === locacao.clienteId)?.nome ?? "-" },
    { header: "Veículo", render: (locacao) => nomeVeiculo(locacao.veiculoId) },
    { header: "Retirada", render: (locacao) => formatarData(locacao.dataRetirada) },
    {
      header: "Devolução",
      render: (locacao) =>
        locacao.dataDevolucaoReal
          ? formatarData(locacao.dataDevolucaoReal)
          : `${formatarData(locacao.dataDevolucaoPrevista)} (prevista)`,
    },
    { header: "Valor", render: (locacao) => formatarMoeda(locacao.valorTotal) },
    {
      header: "Status",
      render: (locacao) => <span className={`badge ${corStatus[locacao.status]}`}>{statusLocacaoLabel[locacao.status]}</span>,
    },
  ];

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Locações</h1>
        <Button label="Nova locação" onClick={() => navigate("/locacoes/nova")} />
      </div>

      <Alert type="success" message={sucesso} onClose={() => setSucesso("")} />
      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      <div className="row">
        <div className="col-md-4">
          <Select
            label="Status"
            name="filtroStatus"
            value={filtroStatus}
            placeholder="Todos os status"
            options={statusDisponiveis.map((status) => ({ value: status, label: statusLocacaoLabel[status] }))}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setFiltroStatus(event.target.value as StatusLocacao | "")}
          />
        </div>
        <div className="col-md-4">
          <Select
            label="Cliente"
            name="filtroCliente"
            value={filtroCliente}
            placeholder="Todos os clientes"
            options={clientes.map((cliente) => ({ value: cliente.id ?? "", label: cliente.nome }))}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setFiltroCliente(event.target.value)}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={locacoesFiltradas}
        emptyMessage="Nenhuma locação encontrada."
        extraActions={(locacao) => (
          <Button label="Detalhes" variant="outline-primary" size="sm" onClick={() => navigate(`/locacoes/${locacao.id}`)} />
        )}
      />
    </div>
  );
}
