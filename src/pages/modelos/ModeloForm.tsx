import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import type { Categoria } from "../../models/Categoria";
import type { Marca } from "../../models/Marca";
import { modeloInicial, type Modelo } from "../../models/Modelo";
import { formatarMoeda, mensagemDeErro } from "../../models/formatadores";
import { categoriaService } from "../../service/categoriaService";
import { marcaService } from "../../service/marcaService";
import { modeloService } from "../../service/modeloService";

export const ModeloForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modelo, setModelo] = useState<Modelo>(modeloInicial);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [erros, setErros] = useState<Partial<Record<keyof Modelo, string>>>({});
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([marcaService.listar(), categoriaService.listar()])
      .then(([listaMarcas, listaCategorias]) => {
        setMarcas(listaMarcas);
        setCategorias(listaCategorias);
      })
      .catch((e: unknown) => setErro(mensagemDeErro(e)));
    if (id) {
      modeloService
        .buscarPorId(id)
        .then(setModelo)
        .catch((e: unknown) => setErro(mensagemDeErro(e)));
    }
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    setModelo((atual) => ({ ...atual, [name]: type === "number" ? Number(value) : value }));
  };

  const validar = (): boolean => {
    const novosErros: Partial<Record<keyof Modelo, string>> = {};
    if (!modelo.nome.trim()) novosErros.nome = "Informe o nome do modelo.";
    if (modelo.ano < 1900) novosErros.ano = "Informe um ano válido.";
    if (!modelo.marcaId) novosErros.marcaId = "Selecione a marca.";
    if (!modelo.categoriaId) novosErros.categoriaId = "Selecione a categoria.";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validar()) return;
    try {
      const dados: Modelo = { ...modelo, nome: modelo.nome.trim() };
      if (id) await modeloService.atualizar(id, dados);
      else await modeloService.criar(dados);
      navigate("/modelos", { state: { mensagem: `Modelo "${dados.nome}" salvo com sucesso.` } });
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-3">{id ? "Editar modelo" : "Novo modelo"}</h1>
      <Alert type="danger" message={erro} onClose={() => setErro("")} />
      <form onSubmit={salvar} noValidate className="card card-body shadow-sm">
        <div className="row">
          <div className="col-md-8">
            <Input label="Nome" name="nome" value={modelo.nome} onChange={handleChange} error={erros.nome} />
          </div>
          <div className="col-md-4">
            <Input label="Ano" name="ano" type="number" value={modelo.ano} onChange={handleChange} error={erros.ano} />
          </div>
          <div className="col-md-6">
            <Select
              label="Marca"
              name="marcaId"
              value={modelo.marcaId}
              options={marcas.map((marca) => ({ value: marca.id ?? "", label: marca.nome }))}
              onChange={handleChange}
              error={erros.marcaId}
            />
          </div>
          <div className="col-md-6">
            <Select
              label="Categoria"
              name="categoriaId"
              value={modelo.categoriaId}
              options={categorias.map((categoria) => ({
                value: categoria.id ?? "",
                label: `${categoria.nome} (${formatarMoeda(categoria.valorLocacao)}/dia)`,
              }))}
              onChange={handleChange}
              error={erros.categoriaId}
            />
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-end">
          <Button label="Cancelar" variant="secondary" onClick={() => navigate("/modelos")} />
          <Button label="Salvar" type="submit" variant="success" />
        </div>
      </form>
    </div>
  );
}
