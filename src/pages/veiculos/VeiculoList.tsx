import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Table, type Column } from "../../components/Table";
import type { Locacao } from "../../models/Locacao";
import type { Manutencao } from "../../models/Manutencao";
import type { Modelo } from "../../models/Modelo";
import {
  calcularSituacaoVeiculo,
  situacaoVeiculoLabel,
  type SituacaoVeiculo,
  type Veiculo,
} from "../../models/Veiculo";
import { dataHoje, mensagemDeErro } from "../../models/formatadores";
import { locacaoService } from "../../service/locacaoService";
import { manutencaoService } from "../../service/manutencaoService";
import { modeloService } from "../../service/modeloService";
import { veiculoService } from "../../service/veiculoService";

const corSituacao: Record<SituacaoVeiculo, string> = {
  DISPONIVEL: "bg-success",
  LOCADO: "bg-primary",
  EM_MANUTENCAO: "bg-warning text-dark",
};

export const VeiculoList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [veiculoParaExcluir, setVeiculoParaExcluir] = useState<Veiculo | null>(null);
  const [sucesso, setSucesso] = useState<string>((location.state as { mensagem?: string } | null)?.mensagem ?? "");
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      const [listaVeiculos, listaModelos, listaLocacoes, listaManutencoes] = await Promise.all([
        veiculoService.listar(),
        modeloService.listar(),
        locacaoService.listar(),
        manutencaoService.listar(),
      ]);
      setVeiculos(listaVeiculos);
      setModelos(listaModelos);
      setLocacoes(listaLocacoes);
      setManutencoes(listaManutencoes);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const excluir = async () => {
    if (!veiculoParaExcluir?.id) return;
    const veiculo = veiculoParaExcluir;
    setVeiculoParaExcluir(null);
    const qtdLocacoes = locacoes.filter((locacao) => locacao.veiculoId === veiculo.id).length;
    const qtdManutencoes = manutencoes.filter((manutencao) => manutencao.veiculoId === veiculo.id).length;
    if (qtdLocacoes > 0 || qtdManutencoes > 0) {
      setSucesso("");
      setErro(
        `Não é possível excluir o veículo ${veiculo.placa}: existem ${qtdLocacoes} locação(ões) e ` +
          `${qtdManutencoes} manutenção(ões) vinculadas a ele.`,
      );
      return;
    }
    try {
      await veiculoService.excluir(veiculo.id!);
      setErro("");
      setSucesso(`Veículo ${veiculo.placa} excluído com sucesso.`);
      carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  const hoje = dataHoje();

  const columns: Column<Veiculo>[] = [
    { header: "Placa", render: (veiculo) => veiculo.placa },
    { header: "Modelo", render: (veiculo) => modelos.find((modelo) => modelo.id === veiculo.modeloId)?.nome ?? "-" },
    { header: "Ano", render: (veiculo) => veiculo.anoFabricacao },
    { header: "Cor", render: (veiculo) => veiculo.cor },
    { header: "Km rodado", render: (veiculo) => veiculo.kmRodado.toLocaleString("pt-BR") },
    {
      header: "Situação",
      render: (veiculo) => {
        const situacao = calcularSituacaoVeiculo(veiculo.id ?? "", locacoes, manutencoes, hoje);
        return <span className={`badge ${corSituacao[situacao]}`}>{situacaoVeiculoLabel[situacao]}</span>;
      },
    },
  ];

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Veículos</h1>
        <Button label="Novo veículo" onClick={() => navigate("/veiculos/novo")} />
      </div>

      <Alert type="success" message={sucesso} onClose={() => setSucesso("")} />
      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      <Table
        columns={columns}
        data={veiculos}
        extraActions={(veiculo) => (
          <Button
            label="Manutenções"
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate(`/manutencoes?veiculoId=${veiculo.id}`)}
          />
        )}
        onEdit={(veiculo) => navigate(`/veiculos/${veiculo.id}`)}
        onDelete={(veiculo) => setVeiculoParaExcluir(veiculo)}
      />

      <Modal
        show={veiculoParaExcluir !== null}
        title="Excluir veículo"
        confirmLabel="Excluir"
        onClose={() => setVeiculoParaExcluir(null)}
        onConfirm={excluir}
      >
        Deseja realmente excluir o veículo <strong>{veiculoParaExcluir?.placa}</strong>?
      </Modal>
    </div>
  );
}
