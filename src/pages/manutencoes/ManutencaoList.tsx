import { useEffect, useState, type ChangeEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { Table, type Column } from "../../components/Table";
import type { Manutencao } from "../../models/Manutencao";
import type { Modelo } from "../../models/Modelo";
import { descreverVeiculo, type Veiculo } from "../../models/Veiculo";
import { formatarData, formatarMoeda, mensagemDeErro } from "../../models/formatadores";
import { manutencaoService } from "../../service/manutencaoService";
import { modeloService } from "../../service/modeloService";
import { veiculoService } from "../../service/veiculoService";

export const ManutencaoList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const veiculoFiltro = searchParams.get("veiculoId") ?? "";
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [manutencaoParaExcluir, setManutencaoParaExcluir] = useState<Manutencao | null>(null);
  const [sucesso, setSucesso] = useState<string>((location.state as { mensagem?: string } | null)?.mensagem ?? "");
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      const [listaManutencoes, listaVeiculos, listaModelos] = await Promise.all([
        manutencaoService.listar(),
        veiculoService.listar(),
        modeloService.listar(),
      ]);
      setManutencoes(listaManutencoes);
      setVeiculos(listaVeiculos);
      setModelos(listaModelos);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const nomeVeiculo = (veiculoId: string): string => {
    const veiculo = veiculos.find((item) => item.id === veiculoId);
    if (!veiculo) return "-";
    return descreverVeiculo(veiculo, modelos.find((modelo) => modelo.id === veiculo.modeloId)?.nome);
  };

  const excluir = async () => {
    if (!manutencaoParaExcluir?.id) return;
    const manutencao = manutencaoParaExcluir;
    setManutencaoParaExcluir(null);
    try {
      await manutencaoService.excluir(manutencao.id!);
      setErro("");
      setSucesso("Manutenção excluída com sucesso.");
      carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  const handleFiltro = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setSearchParams(value ? { veiculoId: value } : {});
  };

  // RF05: histórico de manutenções de cada veículo (mais recentes primeiro)
  const manutencoesFiltradas = manutencoes
    .filter((manutencao) => !veiculoFiltro || manutencao.veiculoId === veiculoFiltro)
    .sort((a, b) => b.data.localeCompare(a.data));

  const totalGasto = manutencoesFiltradas.reduce((total, manutencao) => total + manutencao.valor, 0);

  const columns: Column<Manutencao>[] = [
    { header: "Data", render: (manutencao) => formatarData(manutencao.data) },
    { header: "Veículo", render: (manutencao) => nomeVeiculo(manutencao.veiculoId) },
    { header: "Descrição", render: (manutencao) => manutencao.descricao },
    { header: "Valor", render: (manutencao) => formatarMoeda(manutencao.valor) },
  ];

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Manutenções</h1>
        <Button
          label="Nova manutenção"
          onClick={() => navigate(veiculoFiltro ? `/manutencoes/novo?veiculoId=${veiculoFiltro}` : "/manutencoes/novo")}
        />
      </div>

      <Alert type="success" message={sucesso} onClose={() => setSucesso("")} />
      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      <div className="row">
        <div className="col-md-6 col-lg-4">
          <Select
            label="Histórico do veículo"
            name="veiculoId"
            value={veiculoFiltro}
            placeholder="Todos os veículos"
            options={veiculos.map((veiculo) => ({ value: veiculo.id ?? "", label: nomeVeiculo(veiculo.id ?? "") }))}
            onChange={handleFiltro}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={manutencoesFiltradas}
        emptyMessage="Nenhuma manutenção registrada."
        onEdit={(manutencao) => navigate(`/manutencoes/${manutencao.id}`)}
        onDelete={(manutencao) => setManutencaoParaExcluir(manutencao)}
      />
      {manutencoesFiltradas.length > 0 && (
        <p className="text-end fw-semibold">
          {manutencoesFiltradas.length} manutenção(ões) · Total: {formatarMoeda(totalGasto)}
        </p>
      )}

      <Modal
        show={manutencaoParaExcluir !== null}
        title="Excluir manutenção"
        confirmLabel="Excluir"
        onClose={() => setManutencaoParaExcluir(null)}
        onConfirm={excluir}
      >
        Deseja realmente excluir a manutenção <strong>{manutencaoParaExcluir?.descricao}</strong>?
      </Modal>
    </div>
  );
}
