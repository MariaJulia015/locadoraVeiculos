import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { TextArea } from "../../components/TextArea";
import type { Categoria } from "../../models/Categoria";
import { cnhVencida, type Cliente } from "../../models/Cliente";
import { gerarNumeroContrato, termosPadrao } from "../../models/Contrato";
import { calcularDiarias, calcularValorLocacao, locacaoInicial, type Locacao } from "../../models/Locacao";
import type { Manutencao } from "../../models/Manutencao";
import type { Modelo } from "../../models/Modelo";
import { calcularSituacaoVeiculo, descreverVeiculo, type Veiculo } from "../../models/Veiculo";
import { niveisCombustivel, type NivelCombustivel } from "../../models/Vistoria";
import { dataHoje, formatarMoeda, mensagemDeErro, somarDias } from "../../models/formatadores";
import { categoriaService } from "../../service/categoriaService";
import { clienteService } from "../../service/clienteService";
import { contratoService } from "../../service/contratoService";
import { locacaoService } from "../../service/locacaoService";
import { manutencaoService } from "../../service/manutencaoService";
import { modeloService } from "../../service/modeloService";
import { veiculoService } from "../../service/veiculoService";
import { vistoriaService } from "../../service/vistoriaService";

type ErrosLocacao = Partial<Record<keyof Locacao, string>>;

export const LocacaoForm = () => {
  const navigate = useNavigate();
  // Grupo e diárias escolhidos na tela de grupos (opcionais)
  const [parametros] = useSearchParams();
  const categoriaEscolhida = parametros.get("categoria") ?? "";
  const diariasEscolhidas = Number(parametros.get("diarias") ?? 0);
  const [locacao, setLocacao] = useState<Locacao>({
    ...locacaoInicial,
    dataRetirada: dataHoje(),
    dataDevolucaoPrevista: diariasEscolhidas > 0 ? somarDias(dataHoje(), diariasEscolhidas) : "",
  });
  const [nivelCombustivel, setNivelCombustivel] = useState<NivelCombustivel>("CHEIO");
  const [observacoes, setObservacoes] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [erros, setErros] = useState<ErrosLocacao>({});
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([
      clienteService.listar(),
      veiculoService.listar(),
      modeloService.listar(),
      categoriaService.listar(),
      locacaoService.listar(),
      manutencaoService.listar(),
    ])
      .then(([listaClientes, listaVeiculos, listaModelos, listaCategorias, listaLocacoes, listaManutencoes]) => {
        setClientes(listaClientes);
        setVeiculos(listaVeiculos);
        setModelos(listaModelos);
        setCategorias(listaCategorias);
        setLocacoes(listaLocacoes);
        setManutencoes(listaManutencoes);
      })
      .catch((e: unknown) => setErro(mensagemDeErro(e)));
  }, []);

  const hoje = dataHoje();
  const categoriaDoVeiculo = (veiculo: Veiculo): string | undefined =>
    modelos.find((modelo) => modelo.id === veiculo.modeloId)?.categoriaId;
  const veiculosDisponiveis = veiculos.filter(
    (veiculo) =>
      calcularSituacaoVeiculo(veiculo.id ?? "", locacoes, manutencoes, hoje) === "DISPONIVEL" &&
      (!categoriaEscolhida || categoriaDoVeiculo(veiculo) === categoriaEscolhida),
  );
  const nomeGrupoEscolhido = categorias.find((categoria) => categoria.id === categoriaEscolhida)?.nome;

  const nomeModelo = (veiculo: Veiculo): string | undefined =>
    modelos.find((modelo) => modelo.id === veiculo.modeloId)?.nome;

  const valorDiaria = (veiculoId: string): number => {
    const veiculo = veiculos.find((item) => item.id === veiculoId);
    const modelo = modelos.find((item) => item.id === veiculo?.modeloId);
    return categorias.find((categoria) => categoria.id === modelo?.categoriaId)?.valorLocacao ?? 0;
  };

  // RF08: valor previsto = nº de diárias × valor da diária da categoria
  const datasValidas = Boolean(
    locacao.dataRetirada && locacao.dataDevolucaoPrevista && locacao.dataDevolucaoPrevista > locacao.dataRetirada,
  );
  const diaria = valorDiaria(locacao.veiculoId);
  const diarias = datasValidas ? calcularDiarias(locacao.dataRetirada, locacao.dataDevolucaoPrevista) : 0;
  const valorPrevisto = datasValidas ? calcularValorLocacao(locacao.dataRetirada, locacao.dataDevolucaoPrevista, diaria) : 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    if (name === "veiculoId") {
      const veiculo = veiculos.find((item) => item.id === value);
      setLocacao((atual) => ({ ...atual, veiculoId: value, kmRetirada: veiculo?.kmRodado ?? 0 }));
      return;
    }
    setLocacao((atual) => ({ ...atual, [name]: type === "number" ? Number(value) : value }));
  };

  const validar = async (): Promise<boolean> => {
    const novosErros: ErrosLocacao = {};
    const cliente = clientes.find((item) => item.id === locacao.clienteId);
    if (!cliente) novosErros.clienteId = "Selecione o cliente.";
    if (!locacao.veiculoId) novosErros.veiculoId = "Selecione um veículo disponível.";
    if (!locacao.dataRetirada) novosErros.dataRetirada = "Informe a data de retirada.";
    if (!locacao.dataDevolucaoPrevista) novosErros.dataDevolucaoPrevista = "Informe a data de devolução prevista.";
    if (locacao.kmRetirada < 0) novosErros.kmRetirada = "O km não pode ser negativo.";

    // RN02: devolução prevista posterior à retirada
    if (locacao.dataRetirada && locacao.dataDevolucaoPrevista && locacao.dataDevolucaoPrevista <= locacao.dataRetirada) {
      novosErros.dataDevolucaoPrevista = "A data de devolução prevista deve ser posterior à data de retirada.";
    }

    // RN03: cliente com CNH vencida não pode locar
    if (cliente && locacao.dataRetirada && cnhVencida(cliente, locacao.dataRetirada)) {
      novosErros.clienteId = "Não é permitido registrar locação para cliente com CNH vencida.";
    }

    // RN01: veículo com locação em aberto não pode ser locado novamente (consulta atualizada)
    if (locacao.veiculoId) {
      const locacoesDoVeiculo = await locacaoService.listarPorVeiculo(locacao.veiculoId);
      if (locacoesDoVeiculo.some((item) => item.status === "ABERTA")) {
        novosErros.veiculoId = "Este veículo já possui uma locação em aberto.";
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSalvando(true);
    try {
      if (!(await validar())) return;

      const novaLocacao = await locacaoService.criar({ ...locacao, status: "ABERTA", valorTotal: valorPrevisto });
      const locacaoId = novaLocacao.id ?? "";

      // RF09: contrato gerado automaticamente
      await contratoService.criar({
        numero: gerarNumeroContrato(),
        dataEmissao: hoje,
        termos: termosPadrao,
        locacaoId,
      });

      // RF10: vistoria de retirada
      await vistoriaService.criar({
        tipo: "RETIRADA",
        data: locacao.dataRetirada,
        km: locacao.kmRetirada,
        nivelCombustivel,
        observacoes: observacoes.trim(),
        locacaoId,
      });

      navigate(`/locacoes/${locacaoId}`, { state: { mensagem: "Locação registrada com sucesso. Contrato gerado." } });
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <h1 className="h3 mb-3">Nova locação</h1>
      <Alert type="danger" message={erro} onClose={() => setErro("")} />
      {nomeGrupoEscolhido && (
        <div className="alert alert-light border d-flex justify-content-between align-items-center">
          <span>
            Mostrando apenas veículos do grupo <strong>{nomeGrupoEscolhido}</strong>.
          </span>
          <Button label="Ver todos" variant="outline-secondary" size="sm" onClick={() => navigate("/locacoes/nova")} />
        </div>
      )}

      <form onSubmit={salvar} noValidate>
        <Card title="Dados da locação">
          <div className="row">
            <div className="col-md-6">
              <Select
                label="Cliente"
                name="clienteId"
                value={locacao.clienteId}
                options={clientes.map((cliente) => ({
                  value: cliente.id ?? "",
                  label: `${cliente.nome}${cnhVencida(cliente, hoje) ? " (CNH vencida)" : ""}`,
                }))}
                onChange={handleChange}
                error={erros.clienteId}
              />
            </div>
            <div className="col-md-6">
              <Select
                label="Veículo disponível"
                name="veiculoId"
                value={locacao.veiculoId}
                options={veiculosDisponiveis.map((veiculo) => ({
                  value: veiculo.id ?? "",
                  label: `${descreverVeiculo(veiculo, nomeModelo(veiculo))} · ${formatarMoeda(valorDiaria(veiculo.id ?? ""))}/dia`,
                }))}
                onChange={handleChange}
                error={erros.veiculoId}
              />
            </div>
            <div className="col-md-6">
              <Input
                label="Data de retirada"
                name="dataRetirada"
                type="date"
                value={locacao.dataRetirada}
                onChange={handleChange}
                error={erros.dataRetirada}
              />
            </div>
            <div className="col-md-6">
              <Input
                label="Data de devolução prevista"
                name="dataDevolucaoPrevista"
                type="date"
                value={locacao.dataDevolucaoPrevista}
                onChange={handleChange}
                error={erros.dataDevolucaoPrevista}
              />
            </div>
          </div>
          <div className="alert alert-info mb-0">
            <strong>Valor previsto: {formatarMoeda(valorPrevisto)}</strong>
            {datasValidas && diaria > 0 && (
              <span className="ms-2">
                ({diarias} diária(s) × {formatarMoeda(diaria)})
              </span>
            )}
          </div>
        </Card>

        <Card title="Vistoria de retirada">
          <div className="row">
            <div className="col-md-6">
              <Input
                label="Km na retirada"
                name="kmRetirada"
                type="number"
                min={0}
                value={locacao.kmRetirada}
                onChange={handleChange}
                error={erros.kmRetirada}
              />
            </div>
            <div className="col-md-6">
              <Select
                label="Nível de combustível"
                name="nivelCombustivel"
                value={nivelCombustivel}
                placeholder="Selecione o nível"
                options={niveisCombustivel.map((nivel) => ({ value: nivel, label: nivel }))}
                onChange={(event) => setNivelCombustivel(event.target.value as NivelCombustivel)}
              />
            </div>
          </div>
          <TextArea
            label="Observações"
            name="observacoes"
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
          />
        </Card>

        <div className="d-flex gap-2 justify-content-end">
          <Button label="Cancelar" variant="secondary" onClick={() => navigate("/locacoes")} />
          <Button label={salvando ? "Salvando..." : "Registrar locação"} type="submit" variant="success" disabled={salvando} />
        </div>
      </form>
    </div>
  );
}
