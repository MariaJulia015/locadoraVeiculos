import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { categoriaInicial, type Categoria } from "../../models/Categoria";
import { mensagemDeErro } from "../../models/formatadores";
import { categoriaService } from "../../service/categoriaService";

export const CategoriaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState<Categoria>(categoriaInicial);
  const [erros, setErros] = useState<Partial<Record<keyof Categoria, string>>>({});
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) return;
    categoriaService
      .buscarPorId(id)
      .then(setCategoria)
      .catch((e: unknown) => setErro(mensagemDeErro(e)));
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = event.target;
    setCategoria((atual) => ({ ...atual, [name]: type === "number" ? Number(value) : value }));
  };

  const validar = (): boolean => {
    const novosErros: Partial<Record<keyof Categoria, string>> = {};
    if (!categoria.nome.trim()) novosErros.nome = "Informe o nome da categoria.";
    if (categoria.valorLocacao <= 0) novosErros.valorLocacao = "Informe um valor de diária maior que zero.";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validar()) return;
    try {
      const dados: Categoria = { ...categoria, nome: categoria.nome.trim() };
      if (id) await categoriaService.atualizar(id, dados);
      else await categoriaService.criar(dados);
      navigate("/categorias", { state: { mensagem: `Categoria "${dados.nome}" salva com sucesso.` } });
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-3">{id ? "Editar categoria" : "Nova categoria"}</h1>
      <Alert type="danger" message={erro} onClose={() => setErro("")} />
      <form onSubmit={salvar} noValidate className="card card-body shadow-sm">
        <Input label="Nome" name="nome" value={categoria.nome} onChange={handleChange} error={erros.nome} />
        <Input
          label="Valor da diária (R$)"
          name="valorLocacao"
          type="number"
          min={0}
          step="0.01"
          value={categoria.valorLocacao}
          onChange={handleChange}
          error={erros.valorLocacao}
        />
        <div className="d-flex gap-2 justify-content-end">
          <Button label="Cancelar" variant="secondary" onClick={() => navigate("/categorias")} />
          <Button label="Salvar" type="submit" variant="success" />
        </div>
      </form>
    </div>
  );
}
