import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import type { Categoria } from "../../models/Categoria";
import type { Locacao } from "../../models/Locacao";
import type { Manutencao } from "../../models/Manutencao";
import type { Marca } from "../../models/Marca";
import type { Modelo } from "../../models/Modelo";
import {
  calcularSituacaoVeiculo,
  situacaoVeiculoLabel,
  type SituacaoVeiculo,
  type Veiculo,
} from "../../models/Veiculo";
import { dataHoje, formatarMoeda, mensagemDeErro } from "../../models/formatadores";
import { categoriaService } from "../../service/categoriaService";
import { locacaoService } from "../../service/locacaoService";
import { manutencaoService } from "../../service/manutencaoService";
import { marcaService } from "../../service/marcaService";
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
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [veiculoParaExcluir, setVeiculoParaExcluir] = useState<Veiculo | null>(null);
  const [sucesso, setSucesso] = useState<string>((location.state as { mensagem?: string } | null)?.mensagem ?? "");
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      const [listaVeiculos, listaModelos, listaMarcas, listaCategorias, listaLocacoes, listaManutencoes] =
        await Promise.all([
          veiculoService.listar(),
          modeloService.listar(),
          marcaService.listar(),
          categoriaService.listar(),
          locacaoService.listar(),
          manutencaoService.listar(),
        ]);
      setVeiculos(listaVeiculos);
      setModelos(listaModelos);
      setMarcas(listaMarcas);
      setCategorias(listaCategorias);
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

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-1">Veículos</h1>
          <p className="text-muted mb-0">A frota da Riguilida: diária, situação de cada carro e atalho para alugar.</p>
        </div>
        <Button label="Novo veículo" onClick={() => navigate("/veiculos/novo")} />
      </div>

      <Alert type="success" message={sucesso} onClose={() => setSucesso("")} />
      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      {veiculos.length === 0 && <p className="text-muted">Nenhum veículo cadastrado.</p>}

      <div className="row g-4">
        {veiculos.map((veiculo) => {
          const modelo = modelos.find((item) => item.id === veiculo.modeloId);
          const marca = marcas.find((item) => item.id === modelo?.marcaId);
          const categoria = categorias.find((item) => item.id === modelo?.categoriaId);
          const situacao = calcularSituacaoVeiculo(veiculo.id ?? "", locacoes, manutencoes, hoje);

          return (
            <div className="col-12 col-md-6 col-lg-4" key={veiculo.id}>
              <div className="card h-100 shadow-sm carro-riguilida">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    {categoria ? <span className="etiqueta-categoria">{categoria.nome}</span> : <span />}
                    <span className={`badge ${corSituacao[situacao]}`}>{situacaoVeiculoLabel[situacao]}</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h2 className="h4 nome-carro mb-0">{modelo?.nome ?? "-"}</h2>
                      <p className="text-muted mb-3">
                        {marca?.nome} · {veiculo.anoFabricacao}
                      </p>
                    </div>
                    {categoria && (
                      <div className="text-end">
                        <strong className="diaria-riguilida">{formatarMoeda(categoria.valorLocacao)}</strong>
                        <small className="text-muted d-block">por dia</small>
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-between border-top pt-3 mt-auto mb-3">
                    <div>
                      <small className="text-muted d-block">Placa</small>
                      <span className="placa-riguilida">{veiculo.placa}</span>
                    </div>
                    <div>
                      <small className="text-muted d-block">Cor</small>
                      <strong>{veiculo.cor}</strong>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">Km rodado</small>
                      <strong>{veiculo.kmRodado.toLocaleString("pt-BR")}</strong>
                    </div>
                  </div>

                  <div className="d-grid mb-2">
                    <Button
                      label={situacao === "DISPONIVEL" ? "Alugar" : situacaoVeiculoLabel[situacao]}
                      disabled={situacao !== "DISPONIVEL"}
                      onClick={() => navigate(`/locacoes/nova?veiculo=${veiculo.id}`)}
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <div className="flex-grow-1 d-grid">
                      <Button
                        label="Manutenções"
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => navigate(`/manutencoes?veiculoId=${veiculo.id}`)}
                      />
                    </div>
                    <Button label="Editar" variant="warning" size="sm" onClick={() => navigate(`/veiculos/${veiculo.id}`)} />
                    <Button label="Excluir" variant="danger" size="sm" onClick={() => setVeiculoParaExcluir(veiculo)} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
