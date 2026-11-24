import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { TextArea } from "../../components/TextArea";
import type { Categoria } from "../../models/Categoria";
import { calcularDiarias, calcularValorLocacao, type Locacao } from "../../models/Locacao";
import { niveisCombustivel, type NivelCombustivel } from "../../models/Vistoria";
import { dataHoje, formatarData, formatarMoeda, mensagemDeErro } from "../../models/formatadores";
import { categoriaService } from "../../service/categoriaService";
import { locacaoService } from "../../service/locacaoService";
import { modeloService } from "../../service/modeloService";
import { veiculoService } from "../../service/veiculoService";
import { vistoriaService } from "../../service/vistoriaService";

interface DadosDevolucao {
  dataDevolucaoReal: string;
  kmDevolucao: number;
  nivelCombustivel: NivelCombustivel;
  observacoes: string;
}

export const DevolucaoForm = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [locacao, setLocacao] = useState<Locacao | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [dados, setDados] = useState<DadosDevolucao>({
    dataDevolucaoReal: dataHoje(),
    kmDevolucao: 0,
    nivelCombustivel: "CHEIO",
    observacoes: "",
  });
  const [erros, setErros] = useState<Partial<Record<keyof DadosDevolucao, string>>>({});
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const dadosLocacao = await locacaoService.buscarPorId(id);
        const veiculo = await veiculoService.buscarPorId(dadosLocacao.veiculoId);
        const modelo = await modeloService.buscarPorId(veiculo.modeloId);
        setCategoria(await categoriaService.buscarPorId(modelo.categoriaId));
        setLocacao(dadosLocacao);
        setDados((atual) => ({ ...atual, kmDevolucao: dadosLocacao.kmRetirada }));
      } catch (e) {
        setErro(mensagemDeErro(e));
      }
    };
    carregar();
  }, [id]);

  const diaria = categoria?.valorLocacao ?? 0;
  const dataValida = Boolean(locacao && dados.dataDevolucaoReal && dados.dataDevolucaoReal >= locacao.dataRetirada);
  const diarias = locacao && dataValida ? calcularDiarias(locacao.dataRetirada, dados.dataDevolucaoReal) : 0;
  const valorRecalculado = locacao && dataValida ? calcularValorLocacao(locacao.dataRetirada, dados.dataDevolucaoReal, diaria) : 0;

  const validar = (): boolean => {
    if (!locacao) return false;
    const novosErros: Partial<Record<keyof DadosDevolucao, string>> = {};
    if (!dados.dataDevolucaoReal) novosErros.dataDevolucaoReal = "Informe a data de devolução.";
    else if (dados.dataDevolucaoReal < locacao.dataRetirada) {
      novosErros.dataDevolucaoReal = "A data de devolução não pode ser anterior à data de retirada.";
    }
    // RN04: km de devolução não pode ser menor que o km de retirada
    if (dados.kmDevolucao < locacao.kmRetirada) {
      novosErros.kmDevolucao = `O km de devolução não pode ser menor que o km de retirada (${locacao.kmRetirada.toLocaleString("pt-BR")}).`;
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // RF11: vistoria de devolução + finalização da locação
  const finalizar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!locacao || !validar()) return;
    if (locacao.status !== "ABERTA") {
      setErro("Apenas locações abertas podem ser finalizadas.");
      return;
    }
    setSalvando(true);
    try {
      await vistoriaService.criar({
        tipo: "DEVOLUCAO",
        data: dados.dataDevolucaoReal,
        km: dados.kmDevolucao,
        nivelCombustivel: dados.nivelCombustivel,
        observacoes: dados.observacoes.trim(),
        locacaoId: id,
      });
      await locacaoService.atualizar(id, {
        ...locacao,
        dataDevolucaoReal: dados.dataDevolucaoReal,
        kmDevolucao: dados.kmDevolucao,
        valorTotal: valorRecalculado,
        status: "FINALIZADA",
      });
      await veiculoService.atualizarKm(locacao.veiculoId, dados.kmDevolucao);
      navigate(`/locacoes/${id}`, { state: { mensagem: "Devolução registrada e locação finalizada." } });
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <h1 className="h3 mb-3">Registrar devolução</h1>
      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      {locacao && (
        <form onSubmit={finalizar} noValidate>
          <Card title="Resumo da retirada">
            <div className="row">
              <div className="col-6 col-md-3">
                <small className="text-muted d-block">Retirada</small>
                {formatarData(locacao.dataRetirada)}
              </div>
              <div className="col-6 col-md-3">
                <small className="text-muted d-block">Devolução prevista</small>
                {formatarData(locacao.dataDevolucaoPrevista)}
              </div>
              <div className="col-6 col-md-3">
                <small className="text-muted d-block">Km na retirada</small>
                {locacao.kmRetirada.toLocaleString("pt-BR")}
              </div>
              <div className="col-6 col-md-3">
                <small className="text-muted d-block">Valor previsto</small>
                {formatarMoeda(locacao.valorTotal)}
              </div>
            </div>
          </Card>

          <Card title="Vistoria de devolução">
            <div className="row">
              <div className="col-md-4">
                <Input
                  label="Data de devolução"
                  name="dataDevolucaoReal"
                  type="date"
                  value={dados.dataDevolucaoReal}
                  onChange={(event) => setDados((atual) => ({ ...atual, dataDevolucaoReal: event.target.value }))}
                  error={erros.dataDevolucaoReal}
                />
              </div>
              <div className="col-md-4">
                <Input
                  label="Km na devolução"
                  name="kmDevolucao"
                  type="number"
                  min={0}
                  value={dados.kmDevolucao}
                  onChange={(event) => setDados((atual) => ({ ...atual, kmDevolucao: Number(event.target.value) }))}
                  error={erros.kmDevolucao}
                />
              </div>
              <div className="col-md-4">
                <Select
                  label="Nível de combustível"
                  name="nivelCombustivel"
                  value={dados.nivelCombustivel}
                  placeholder="Selecione o nível"
                  options={niveisCombustivel.map((nivel) => ({ value: nivel, label: nivel }))}
                  onChange={(event) =>
                    setDados((atual) => ({ ...atual, nivelCombustivel: event.target.value as NivelCombustivel }))
                  }
                />
              </div>
            </div>
            <TextArea
              label="Observações"
              name="observacoes"
              value={dados.observacoes}
              onChange={(event) => setDados((atual) => ({ ...atual, observacoes: event.target.value }))}
            />
            <div className="alert alert-info mb-0">
              <strong>Valor total recalculado: {formatarMoeda(valorRecalculado)}</strong>
              {dataValida && (
                <span className="ms-2">
                  ({diarias} diária(s) × {formatarMoeda(diaria)})
                </span>
              )}
            </div>
          </Card>

          <div className="d-flex gap-2 justify-content-end">
            <Button label="Cancelar" variant="secondary" onClick={() => navigate(`/locacoes/${id}`)} />
            <Button
              label={salvando ? "Finalizando..." : "Finalizar locação"}
              type="submit"
              variant="success"
              disabled={salvando}
            />
          </div>
        </form>
      )}
    </div>
  );
}
