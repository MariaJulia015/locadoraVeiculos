import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { marcaInicial, type Marca } from "../../models/Marca";
import { mensagemDeErro } from "../../models/formatadores";
import { marcaService } from "../../service/marcaService";

export const MarcaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [marca, setMarca] = useState<Marca>(marcaInicial);
  const [erros, setErros] = useState<Partial<Record<keyof Marca, string>>>({});
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) return;
    marcaService
      .buscarPorId(id)
      .then(setMarca)
      .catch((e: unknown) => setErro(mensagemDeErro(e)));
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setMarca((atual) => ({ ...atual, [name]: value }));
  };

  const validar = (): boolean => {
    const novosErros: Partial<Record<keyof Marca, string>> = {};
    if (!marca.nome.trim()) novosErros.nome = "Informe o nome da marca.";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validar()) return;
    try {
      const dados: Marca = { ...marca, nome: marca.nome.trim() };
      if (id) await marcaService.atualizar(id, dados);
      else await marcaService.criar(dados);
      navigate("/marcas", { state: { mensagem: `Marca "${dados.nome}" salva com sucesso.` } });
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-3">{id ? "Editar marca" : "Nova marca"}</h1>
      <Alert type="danger" message={erro} onClose={() => setErro("")} />
      <form onSubmit={salvar} noValidate className="card card-body shadow-sm">
        <Input label="Nome" name="nome" value={marca.nome} onChange={handleChange} error={erros.nome} />
        <div className="d-flex gap-2 justify-content-end">
          <Button label="Cancelar" variant="secondary" onClick={() => navigate("/marcas")} />
          <Button label="Salvar" type="submit" variant="success" />
        </div>
      </form>
    </div>
  );
}
