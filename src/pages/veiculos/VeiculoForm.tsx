import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import type { Modelo } from "../../models/Modelo";
import { veiculoInicial, type Veiculo } from "../../models/Veiculo";
import { mensagemDeErro } from "../../models/formatadores";
import { modeloService } from "../../service/modeloService";
import { veiculoService } from "../../service/veiculoService";

export const VeiculoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [veiculo, setVeiculo] = useState<Veiculo>(veiculoInicial);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [erros, setErros] = useState<Partial<Record<keyof Veiculo, string>>>({});
  const [erro, setErro] = useState("");

  useEffect(() => {
    modeloService
      .listar()
      .then(setModelos)
      .catch((e: unknown) => setErro(mensagemDeErro(e)));
    if (id) {
      veiculoService
        .buscarPorId(id)
        .then(setVeiculo)
        .catch((e: unknown) => setErro(mensagemDeErro(e)));
    }
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    setVeiculo((atual) => ({ ...atual, [name]: type === "number" ? Number(value) : value }));
  };

  const validar = async (dados: Veiculo): Promise<boolean> => {
    const novosErros: Partial<Record<keyof Veiculo, string>> = {};
    if (!dados.placa) novosErros.placa = "Informe a placa.";
    if (!dados.chassi) novosErros.chassi = "Informe o chassi.";
    if (!dados.modeloId) novosErros.modeloId = "Selecione o modelo.";
    if (!dados.cor.trim()) novosErros.cor = "Informe a cor.";
    if (dados.anoFabricacao < 1900) novosErros.anoFabricacao = "Informe um ano válido.";
    if (dados.kmRodado < 0) novosErros.kmRodado = "O km rodado não pode ser negativo.";

    // RF04: placa e chassi não podem se repetir
    const outros = (await veiculoService.listar()).filter((outro) => outro.id !== id);
    if (dados.placa && outros.some((outro) => outro.placa === dados.placa)) {
      novosErros.placa = "Já existe um veículo com esta placa.";
    }
    if (dados.chassi && outros.some((outro) => outro.chassi === dados.chassi)) {
      novosErros.chassi = "Já existe um veículo com este chassi.";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const dados: Veiculo = {
        ...veiculo,
        placa: veiculo.placa.trim().toUpperCase(),
        chassi: veiculo.chassi.trim().toUpperCase(),
        cor: veiculo.cor.trim(),
      };
      if (!(await validar(dados))) return;
      if (id) await veiculoService.atualizar(id, dados);
      else await veiculoService.criar(dados);
      navigate("/veiculos", { state: { mensagem: `Veículo ${dados.placa} salvo com sucesso.` } });
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 className="h3 mb-3">{id ? "Editar veículo" : "Novo veículo"}</h1>
      <Alert type="danger" message={erro} onClose={() => setErro("")} />
      <form onSubmit={salvar} noValidate className="card card-body shadow-sm">
        <div className="row">
          <div className="col-md-6">
            <Select
              label="Modelo"
              name="modeloId"
              value={veiculo.modeloId}
              options={modelos.map((modelo) => ({ value: modelo.id ?? "", label: `${modelo.nome} (${modelo.ano})` }))}
              onChange={handleChange}
              error={erros.modeloId}
            />
          </div>
          <div className="col-md-6">
            <Input label="Placa" name="placa" value={veiculo.placa} onChange={handleChange} error={erros.placa} />
          </div>
          <div className="col-md-6">
            <Input label="Chassi" name="chassi" value={veiculo.chassi} onChange={handleChange} error={erros.chassi} />
          </div>
          <div className="col-md-6">
            <Input label="Cor" name="cor" value={veiculo.cor} onChange={handleChange} error={erros.cor} />
          </div>
          <div className="col-md-6">
            <Input
              label="Ano de fabricação"
              name="anoFabricacao"
              type="number"
              value={veiculo.anoFabricacao}
              onChange={handleChange}
              error={erros.anoFabricacao}
            />
          </div>
          <div className="col-md-6">
            <Input
              label="Km rodado"
              name="kmRodado"
              type="number"
              min={0}
              value={veiculo.kmRodado}
              onChange={handleChange}
              error={erros.kmRodado}
            />
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-end">
          <Button label="Cancelar" variant="secondary" onClick={() => navigate("/veiculos")} />
          <Button label="Salvar" type="submit" variant="success" />
        </div>
      </form>
    </div>
  );
}
