import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { Table, type Column } from "../../components/Table";
import type { Cliente } from "../../models/Cliente";
import type { Contrato } from "../../models/Contrato";
import { statusLocacaoLabel, type Locacao } from "../../models/Locacao";
import type { Modelo } from "../../models/Modelo";
import { gerarNumeroNotaFiscal, type NotaFiscal } from "../../models/NotaFiscal";
import {
  formaPagamentoLabel,
  pagamentoInicial,
  statusPagamentoLabel,
  type FormaPagamento,
  type Pagamento,
  type StatusPagamento,
} from "../../models/Pagamento";
import type { Veiculo } from "../../models/Veiculo";
import { tipoVistoriaLabel, type Vistoria } from "../../models/Vistoria";
import { dataHoje, formatarData, formatarMoeda, mensagemDeErro } from "../../models/formatadores";
import { clienteService } from "../../service/clienteService";
import { contratoService } from "../../service/contratoService";
import { locacaoService } from "../../service/locacaoService";
import { modeloService } from "../../service/modeloService";
import { notaFiscalService } from "../../service/notaFiscalService";
import { pagamentoService } from "../../service/pagamentoService";
import { veiculoService } from "../../service/veiculoService";
import { vistoriaService } from "../../service/vistoriaService";

const formasPagamento = Object.keys(formaPagamentoLabel) as FormaPagamento[];
const statusPagamento = Object.keys(statusPagamentoLabel) as StatusPagamento[];

function Info({ rotulo, valor }: { rotulo: string; valor: string | number }) {
  return (
    <div className="col-6 col-md-4 mb-2">
      <small className="text-muted d-block">{rotulo}</small>
      <span>{valor}</span>
    </div>
  );
}

export const LocacaoDetalhe = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [locacao, setLocacao] = useState<Locacao | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [modelo, setModelo] = useState<Modelo | null>(null);
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [notaFiscal, setNotaFiscal] = useState<NotaFiscal | null>(null);
  const [novoPagamento, setNovoPagamento] = useState<Pagamento>({ ...pagamentoInicial, data: dataHoje(), locacaoId: id });
  const [errosPagamento, setErrosPagamento] = useState<Partial<Record<keyof Pagamento, string>>>({});
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);
  const [sucesso, setSucesso] = useState<string>((location.state as { mensagem?: string } | null)?.mensagem ?? "");
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      const dadosLocacao = await locacaoService.buscarPorId(id);
      const [dadosCliente, dadosVeiculo, contratos, listaVistorias, listaPagamentos, notas] = await Promise.all([
        clienteService.buscarPorId(dadosLocacao.clienteId),
        veiculoService.buscarPorId(dadosLocacao.veiculoId),
        contratoService.listarPorLocacao(id),
        vistoriaService.listarPorLocacao(id),
        pagamentoService.listarPorLocacao(id),
        notaFiscalService.listarPorLocacao(id),
      ]);
      setLocacao(dadosLocacao);
      setCliente(dadosCliente);
      setVeiculo(dadosVeiculo);
      setModelo(await modeloService.buscarPorId(dadosVeiculo.modeloId));
      setContrato(contratos[0] ?? null);
      setVistorias(listaVistorias);
      setPagamentos(listaPagamentos);
      setNotaFiscal(notas[0] ?? null);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  useEffect(() => {
    carregar();
  }, [id]);

  const totalPago = pagamentos
    .filter((pagamento) => pagamento.status === "PAGO")
    .reduce((total, pagamento) => total + pagamento.valor, 0);
  const saldo = (locacao?.valorTotal ?? 0) - totalPago;

  const handlePagamentoChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    setNovoPagamento((atual) => ({ ...atual, [name]: type === "number" ? Number(value) : value }));
  };

  // RF12: registrar pagamentos (mais de um por locação)
  const registrarPagamento = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const novosErros: Partial<Record<keyof Pagamento, string>> = {};
    if (!novoPagamento.data) novosErros.data = "Informe a data.";
    if (novoPagamento.valor <= 0) novosErros.valor = "Informe um valor maior que zero.";
    if (!novoPagamento.forma) novosErros.forma = "Selecione a forma de pagamento.";
    if (!novoPagamento.status) novosErros.status = "Selecione o status.";
    setErrosPagamento(novosErros);
    if (Object.keys(novosErros).length > 0) return;
    try {
      await pagamentoService.criar({ ...novoPagamento, locacaoId: id });
      setNovoPagamento({ ...pagamentoInicial, data: dataHoje(), locacaoId: id });
      setSucesso("Pagamento registrado com sucesso.");
      setErro("");
      carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  // RF13 + RN05: nota fiscal só para locação finalizada, no máximo uma por locação
  const emitirNotaFiscal = async () => {
    if (!locacao) return;
    if (locacao.status !== "FINALIZADA") {
      setErro("A nota fiscal só pode ser emitida para locações com status Finalizada.");
      return;
    }
    const notas = await notaFiscalService.listarPorLocacao(id);
    if (notas.length > 0) {
      setErro("Esta locação já possui nota fiscal emitida.");
      return;
    }
    try {
      await notaFiscalService.criar({
        numero: gerarNumeroNotaFiscal(),
        serie: "1",
        dataEmissao: dataHoje(),
        valor: locacao.valorTotal,
        locacaoId: id,
      });
      setSucesso("Nota fiscal emitida com sucesso.");
      setErro("");
      carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  const cancelarLocacao = async () => {
    setConfirmarCancelamento(false);
    if (!locacao) return;
    try {
      await locacaoService.atualizar(id, { ...locacao, status: "CANCELADA" });
      setSucesso("Locação cancelada.");
      setErro("");
      carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  const colunasVistoria: Column<Vistoria>[] = [
    { header: "Tipo", render: (vistoria) => tipoVistoriaLabel[vistoria.tipo] },
    { header: "Data", render: (vistoria) => formatarData(vistoria.data) },
    { header: "Km", render: (vistoria) => vistoria.km.toLocaleString("pt-BR") },
    { header: "Combustível", render: (vistoria) => vistoria.nivelCombustivel },
    { header: "Observações", render: (vistoria) => vistoria.observacoes || "-" },
  ];

  const colunasPagamento: Column<Pagamento>[] = [
    { header: "Data", render: (pagamento) => formatarData(pagamento.data) },
    { header: "Valor", render: (pagamento) => formatarMoeda(pagamento.valor) },
    { header: "Forma", render: (pagamento) => formaPagamentoLabel[pagamento.forma] },
    { header: "Status", render: (pagamento) => statusPagamentoLabel[pagamento.status] },
  ];

  if (!locacao) {
    return (
      <div className="container">
        <Alert type="danger" message={erro} />
        {!erro && <p className="text-muted">Carregando...</p>}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">
          Locação{" "}
          <span className="badge bg-secondary align-middle fs-6">{statusLocacaoLabel[locacao.status]}</span>
        </h1>
        <div className="d-flex flex-wrap gap-2">
          <Button label="Voltar" variant="secondary" onClick={() => navigate("/locacoes")} />
          {locacao.status === "ABERTA" && (
            <>
              <Button label="Cancelar locação" variant="outline-secondary" onClick={() => setConfirmarCancelamento(true)} />
              <Button label="Registrar devolução" variant="success" onClick={() => navigate(`/locacoes/${id}/devolucao`)} />
            </>
          )}
        </div>
      </div>

      <Alert type="success" message={sucesso} onClose={() => setSucesso("")} />
      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      <div className="row">
        <div className="col-lg-6">
          <Card title="Cliente">
            <div className="row">
              <Info rotulo="Nome" valor={cliente?.nome ?? "-"} />
              <Info rotulo="CPF" valor={cliente?.cpf ?? "-"} />
              <Info rotulo="CNH" valor={cliente?.cnh ?? "-"} />
              <Info rotulo="Telefone" valor={cliente?.telefone ?? "-"} />
              <Info rotulo="E-mail" valor={cliente?.email ?? "-"} />
            </div>
          </Card>
        </div>
        <div className="col-lg-6">
          <Card title="Veículo">
            <div className="row">
              <Info rotulo="Placa" valor={veiculo?.placa ?? "-"} />
              <Info rotulo="Modelo" valor={modelo ? `${modelo.nome} (${modelo.ano})` : "-"} />
              <Info rotulo="Cor" valor={veiculo?.cor ?? "-"} />
              <Info rotulo="Chassi" valor={veiculo?.chassi ?? "-"} />
              <Info rotulo="Km atual" valor={veiculo ? veiculo.kmRodado.toLocaleString("pt-BR") : "-"} />
            </div>
          </Card>
        </div>
      </div>

      <Card title="Dados da locação">
        <div className="row">
          <Info rotulo="Retirada" valor={formatarData(locacao.dataRetirada)} />
          <Info rotulo="Devolução prevista" valor={formatarData(locacao.dataDevolucaoPrevista)} />
          <Info rotulo="Devolução real" valor={formatarData(locacao.dataDevolucaoReal)} />
          <Info rotulo="Km na retirada" valor={locacao.kmRetirada.toLocaleString("pt-BR")} />
          <Info rotulo="Km na devolução" valor={locacao.kmDevolucao?.toLocaleString("pt-BR") ?? "-"} />
          <Info rotulo="Valor total" valor={formatarMoeda(locacao.valorTotal)} />
        </div>
      </Card>

      <Card title="Contrato">
        {contrato ? (
          <div className="row">
            <Info rotulo="Número" valor={contrato.numero} />
            <Info rotulo="Emissão" valor={formatarData(contrato.dataEmissao)} />
            <div className="col-12">
              <small className="text-muted d-block">Termos</small>
              <span>{contrato.termos}</span>
            </div>
          </div>
        ) : (
          <p className="text-muted mb-0">Contrato não encontrado.</p>
        )}
      </Card>

      <Card title="Vistorias">
        <Table columns={colunasVistoria} data={vistorias} emptyMessage="Nenhuma vistoria registrada." />
      </Card>

      <Card title="Pagamentos">
        <Table columns={colunasPagamento} data={pagamentos} emptyMessage="Nenhum pagamento registrado." />
        <p className="fw-semibold">
          Total pago: {formatarMoeda(totalPago)} · Saldo: {formatarMoeda(saldo)}
        </p>
        {locacao.status !== "CANCELADA" && (
          <form onSubmit={registrarPagamento} noValidate className="row align-items-end border-top pt-3">
            <div className="col-md-3">
              <Input
                label="Data"
                name="data"
                type="date"
                value={novoPagamento.data}
                onChange={handlePagamentoChange}
                error={errosPagamento.data}
              />
            </div>
            <div className="col-md-2">
              <Input
                label="Valor (R$)"
                name="valor"
                type="number"
                min={0}
                step="0.01"
                value={novoPagamento.valor}
                onChange={handlePagamentoChange}
                error={errosPagamento.valor}
              />
            </div>
            <div className="col-md-3">
              <Select
                label="Forma"
                name="forma"
                value={novoPagamento.forma}
                options={formasPagamento.map((forma) => ({ value: forma, label: formaPagamentoLabel[forma] }))}
                onChange={handlePagamentoChange}
                error={errosPagamento.forma}
              />
            </div>
            <div className="col-md-2">
              <Select
                label="Status"
                name="status"
                value={novoPagamento.status}
                options={statusPagamento.map((status) => ({ value: status, label: statusPagamentoLabel[status] }))}
                onChange={handlePagamentoChange}
                error={errosPagamento.status}
              />
            </div>
            <div className="col-md-2 mb-3 d-grid">
              <Button label="Registrar" type="submit" variant="primary" />
            </div>
          </form>
        )}
      </Card>

      <Card
        title="Nota fiscal"
        actions={
          !notaFiscal && locacao.status === "FINALIZADA" ? (
            <Button label="Emitir nota fiscal" variant="success" size="sm" onClick={emitirNotaFiscal} />
          ) : undefined
        }
      >
        {notaFiscal ? (
          <div className="row">
            <Info rotulo="Número" valor={notaFiscal.numero} />
            <Info rotulo="Série" valor={notaFiscal.serie} />
            <Info rotulo="Emissão" valor={formatarData(notaFiscal.dataEmissao)} />
            <Info rotulo="Valor" valor={formatarMoeda(notaFiscal.valor)} />
          </div>
        ) : (
          <p className="text-muted mb-0">
            {locacao.status === "FINALIZADA"
              ? "Nenhuma nota fiscal emitida."
              : "A nota fiscal só pode ser emitida depois que a locação for finalizada."}
          </p>
        )}
      </Card>

      <Modal
        show={confirmarCancelamento}
        title="Cancelar locação"
        confirmLabel="Cancelar locação"
        onClose={() => setConfirmarCancelamento(false)}
        onConfirm={cancelarLocacao}
      >
        Deseja realmente cancelar esta locação? O veículo voltará a ficar disponível.
      </Modal>
    </div>
  );
}
