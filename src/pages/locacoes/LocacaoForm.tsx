import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { TextArea } from "../../components/TextArea";
import type { Categoria } from "../../models/Categoria";
import {
  clienteInicial,
  cnhVencida,
  limparCliente,
  validarCliente,
  type Cliente,
  type ErrosCliente,
} from "../../models/Cliente";
import { gerarNumeroContrato, termosPadrao } from "../../models/Contrato";
import { calcularDiarias, calcularValorLocacao, locacaoInicial, type Locacao } from "../../models/Locacao";
import type { Manutencao } from "../../models/Manutencao";
import type { Modelo } from "../../models/Modelo";
import { calcularSituacaoVeiculo, descreverVeiculo, type Veiculo } from "../../models/Veiculo";
import { niveisCombustivel, type NivelCombustivel } from "../../models/Vistoria";
import { dataHoje, formatarData, formatarMoeda, mensagemDeErro } from "../../models/formatadores";
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
  // Veículo escolhido pelo botão "Alugar" na tela de veículos (opcional)
  const [parametros] = useSearchParams();
  const veiculoEscolhido = parametros.get("veiculo") ?? "";
  const [locacao, setLocacao] = useState<Locacao>({
    ...locacaoInicial,
    dataRetirada: dataHoje(),
    veiculoId: veiculoEscolhido,
  });
  const [nivelCombustivel, setNivelCombustivel] = useState<NivelCombustivel>("CHEIO");
  const [observacoes, setObservacoes] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  // Cadastro rápido de cliente sem sair da locação
  const [novoCliente, setNovoCliente] = useState<Cliente | null>(null);
  const [errosNovoCliente, setErrosNovoCliente] = useState<ErrosCliente>({});
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
        const veiculo = listaVeiculos.find((item) => item.id === veiculoEscolhido);
        if (veiculo) setLocacao((atual) => ({ ...atual, kmRetirada: veiculo.kmRodado }));
        setModelos(listaModelos);
        setCategorias(listaCategorias);
        setLocacoes(listaLocacoes);
        setManutencoes(listaManutencoes);
      })
      .catch((e: unknown) => setErro(mensagemDeErro(e)));
  }, []);

  const hoje = dataHoje();
  const veiculosDisponiveis = veiculos.filter(
    (veiculo) => calcularSituacaoVeiculo(veiculo.id ?? "", locacoes, manutencoes, hoje) === "DISPONIVEL",
  );

  // Busca de cliente por nome ou CPF (mostra no máximo 6 resultados)
  const somenteNumeros = (texto: string) => texto.replace(/\D/g, "");
  const termo = buscaCliente.trim().toLowerCase();
  const clientesEncontrados =
    termo.length < 2
      ? []
      : clientes
          .filter(
            (cliente) =>
              cliente.nome.toLowerCase().includes(termo) ||
              (somenteNumeros(termo).length > 0 && somenteNumeros(cliente.cpf).includes(somenteNumeros(termo))),
          )
          .slice(0, 6);
  const clienteSelecionado = clientes.find((cliente) => cliente.id === locacao.clienteId);

  const selecionarCliente = (clienteId: string) => {
    setLocacao((atual) => ({ ...atual, clienteId }));
    setBuscaCliente("");
  };

  const abrirCadastroCliente = () => {
    // Aproveita o que já foi digitado na busca: números viram CPF, texto vira nome
    const digitado = buscaCliente.trim();
    const pareceCpf = digitado !== "" && somenteNumeros(digitado).length === digitado.replace(/[.\-\s]/g, "").length;
    setNovoCliente({ ...clienteInicial, nome: pareceCpf ? "" : digitado, cpf: pareceCpf ? digitado : "" });
    setErrosNovoCliente({});
  };

  const alterarNovoCliente = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setNovoCliente((atual) => (atual ? { ...atual, [name]: value } : atual));
  };

  const salvarNovoCliente = async () => {
    if (!novoCliente) return;
    try {
      const dados = limparCliente(novoCliente);
      const listaAtual = await clienteService.listar();
      const errosEncontrados = validarCliente(dados, listaAtual);
      setErrosNovoCliente(errosEncontrados);
      if (Object.keys(errosEncontrados).length > 0) return;
      const criado = await clienteService.criar(dados);
      setClientes([...listaAtual, criado]);
      selecionarCliente(criado.id ?? "");
      setNovoCliente(null);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

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

      <form onSubmit={salvar} noValidate>
        <Card title="Dados da locação">
          <div className="row">
            <div className="col-md-6">
              {clienteSelecionado ? (
                <div className="mb-3">
                  <span className="form-label d-block">Cliente</span>
                  <div className="border rounded p-2 d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{clienteSelecionado.nome}</strong>
                      <small className="text-muted d-block">
                        CPF {clienteSelecionado.cpf} ·{" "}
                        {cnhVencida(clienteSelecionado, hoje) ? (
                          <span className="text-danger">CNH vencida</span>
                        ) : (
                          `CNH válida até ${formatarData(clienteSelecionado.validadeCnh)}`
                        )}
                      </small>
                    </div>
                    <Button
                      label="Trocar"
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setLocacao((atual) => ({ ...atual, clienteId: "" }))}
                    />
                  </div>
                  {erros.clienteId && <div className="text-danger small mt-1">{erros.clienteId}</div>}
                </div>
              ) : (
                <>
                  <Input
                    label="Cliente"
                    name="buscaCliente"
                    value={buscaCliente}
                    placeholder="Digite o nome ou o CPF"
                    onChange={(event) => setBuscaCliente(event.target.value)}
                    error={erros.clienteId}
                  />
                  {termo.length >= 2 && (
                    <ul className="list-group mb-3" style={{ marginTop: "-0.5rem" }}>
                      {clientesEncontrados.length === 0 && (
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                          <span className="text-muted">Nenhum cliente encontrado.</span>
                          <Button
                            label="Cadastrar agora"
                            variant="outline-primary"
                            size="sm"
                            onClick={abrirCadastroCliente}
                          />
                        </li>
                      )}
                      {clientesEncontrados.map((cliente) => (
                        <li
                          className="list-group-item d-flex justify-content-between align-items-center"
                          key={cliente.id}
                        >
                          <span>
                            {cliente.nome}
                            <small className="text-muted d-block">
                              CPF {cliente.cpf}
                              {cnhVencida(cliente, hoje) && <span className="text-danger"> · CNH vencida</span>}
                            </small>
                          </span>
                          <Button
                            label="Selecionar"
                            variant="outline-primary"
                            size="sm"
                            onClick={() => selecionarCliente(cliente.id ?? "")}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                  {termo.length < 2 && (
                    <p className="small text-muted mb-3" style={{ marginTop: "-0.5rem" }}>
                      Cliente novo?{" "}
                      <Button label="Cadastrar na hora" variant="outline-primary" size="sm" onClick={abrirCadastroCliente} />
                    </p>
                  )}
                </>
              )}
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

      <Modal
        show={novoCliente !== null}
        title="Cadastrar cliente"
        confirmLabel="Cadastrar e selecionar"
        confirmVariant="success"
        size="lg"
        onClose={() => setNovoCliente(null)}
        onConfirm={salvarNovoCliente}
      >
        {novoCliente && (
          <div className="row">
            <div className="col-md-6">
              <Input label="Nome" name="nome" value={novoCliente.nome} onChange={alterarNovoCliente} error={errosNovoCliente.nome} />
            </div>
            <div className="col-md-6">
              <Input
                label="CPF"
                name="cpf"
                value={novoCliente.cpf}
                onChange={alterarNovoCliente}
                placeholder="000.000.000-00"
                error={errosNovoCliente.cpf}
              />
            </div>
            <div className="col-md-6">
              <Input label="Número da CNH" name="cnh" value={novoCliente.cnh} onChange={alterarNovoCliente} error={errosNovoCliente.cnh} />
            </div>
            <div className="col-md-6">
              <Input
                label="Validade da CNH"
                name="validadeCnh"
                type="date"
                value={novoCliente.validadeCnh}
                onChange={alterarNovoCliente}
                error={errosNovoCliente.validadeCnh}
              />
            </div>
            <div className="col-md-6">
              <Input
                label="Telefone"
                name="telefone"
                type="tel"
                value={novoCliente.telefone}
                onChange={alterarNovoCliente}
                placeholder="(62) 99999-9999"
                error={errosNovoCliente.telefone}
              />
            </div>
            <div className="col-md-6">
              <Input
                label="E-mail"
                name="email"
                type="email"
                value={novoCliente.email}
                onChange={alterarNovoCliente}
                error={errosNovoCliente.email}
              />
            </div>
            <div className="col-12">
              <Input
                label="Endereço"
                name="endereco"
                value={novoCliente.endereco}
                onChange={alterarNovoCliente}
                error={errosNovoCliente.endereco}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
