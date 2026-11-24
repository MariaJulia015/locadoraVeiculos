import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { TextArea } from "../../components/TextArea";
import { manutencaoInicial, type Manutencao } from "../../models/Manutencao";
import type { Modelo } from "../../models/Modelo";
import { descreverVeiculo, type Veiculo } from "../../models/Veiculo";
import { dataHoje, mensagemDeErro } from "../../models/formatadores";
import { manutencaoService } from "../../service/manutencaoService";
import { modeloService } from "../../service/modeloService";
import { veiculoService } from "../../service/veiculoService";

export const ManutencaoForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [manutencao, setManutencao] = useState<Manutencao>({
    ...manutencaoInicial,
    data: dataHoje(),
    veiculoId: searchParams.get("veiculoId") ?? "",
  });
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [erros, setErros] = useState<Partial<Record<keyof Manutencao, string>>>({});
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([veiculoService.listar(), modeloService.listar()])
      .then(([listaVeiculos, listaModelos]) => {
        setVeiculos(listaVeiculos);
        setModelos(listaModelos);
      })
      .catch((e: unknown) => setErro(mensagemDeErro(e)));
    if (id) {
      manutencaoService
        .buscarPorId(id)
        .then(setManutencao)
        .catch((e: unknown) => setErro(mensagemDeErro(e)));
    }
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    setManutencao((atual) => ({ ...atual, [name]: type === "number" ? Number(value) : value }));
  };

  const validar = (): boolean => {
    const novosErros: Partial<Record<keyof Manutencao, string>> = {};
    if (!manutencao.veiculoId) novosErros.veiculoId = "Selecione o veículo.";
    if (!manutencao.data) novosErros.data = "Informe a data.";
    if (!manutencao.descricao.trim()) novosErros.descricao = "Descreva o serviço realizado.";
    if (manutencao.valor < 0) novosErros.valor = "O valor não pode ser negativo.";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validar()) return;
    try {
      const dados: Manutencao = { ...manutencao, descricao: manutencao.descricao.trim() };
      if (id) await manutencaoService.atualizar(id, dados);
      else await manutencaoService.criar(dados);
      navigate(`/manutencoes?veiculoId=${dados.veiculoId}`, { state: { mensagem: "Manutenção salva com sucesso." } });
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 className="h3 mb-3">{id ? "Editar manutenção" : "Nova manutenção"}</h1>
      <Alert type="danger" message={erro} onClose={() => setErro("")} />
      <form onSubmit={salvar} noValidate className="card card-body shadow-sm">
        <div className="row">
          <div className="col-md-6">
            <Select
              label="Veículo"
              name="veiculoId"
              value={manutencao.veiculoId}
              options={veiculos.map((veiculo) => ({
                value: veiculo.id ?? "",
                label: descreverVeiculo(veiculo, modelos.find((modelo) => modelo.id === veiculo.modeloId)?.nome),
              }))}
              onChange={handleChange}
              error={erros.veiculoId}
            />
          </div>
          <div className="col-md-3">
            <Input label="Data" name="data" type="date" value={manutencao.data} onChange={handleChange} error={erros.data} />
          </div>
          <div className="col-md-3">
            <Input
              label="Valor (R$)"
              name="valor"
              type="number"
              min={0}
              step="0.01"
              value={manutencao.valor}
              onChange={handleChange}
              error={erros.valor}
            />
          </div>
        </div>
        <TextArea
          label="Descrição"
          name="descricao"
          value={manutencao.descricao}
          onChange={handleChange}
          error={erros.descricao}
        />
        <div className="d-flex gap-2 justify-content-end">
          <Button label="Cancelar" variant="secondary" onClick={() => navigate("/manutencoes")} />
          <Button label="Salvar" type="submit" variant="success" />
        </div>
      </form>
    </div>
  );
}
