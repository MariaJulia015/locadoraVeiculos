import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Table, type Column } from "../../components/Table";
import type { Categoria } from "../../models/Categoria";
import type { Marca } from "../../models/Marca";
import type { Modelo } from "../../models/Modelo";
import { mensagemDeErro } from "../../models/formatadores";
import { categoriaService } from "../../service/categoriaService";
import { marcaService } from "../../service/marcaService";
import { modeloService } from "../../service/modeloService";
import { veiculoService } from "../../service/veiculoService";

export const ModeloList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modeloParaExcluir, setModeloParaExcluir] = useState<Modelo | null>(null);
  const [sucesso, setSucesso] = useState<string>((location.state as { mensagem?: string } | null)?.mensagem ?? "");
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      const [listaModelos, listaMarcas, listaCategorias] = await Promise.all([
        modeloService.listar(),
        marcaService.listar(),
        categoriaService.listar(),
      ]);
      setModelos(listaModelos);
      setMarcas(listaMarcas);
      setCategorias(listaCategorias);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const excluir = async () => {
    if (!modeloParaExcluir?.id) return;
    const modelo = modeloParaExcluir;
    setModeloParaExcluir(null);
    try {
      const veiculos = await veiculoService.listar();
      const vinculados = veiculos.filter((veiculo) => veiculo.modeloId === modelo.id);
      if (vinculados.length > 0) {
        setSucesso("");
        setErro(`Não é possível excluir o modelo "${modelo.nome}": existem ${vinculados.length} veículo(s) vinculado(s) a ele.`);
        return;
      }
      await modeloService.excluir(modelo.id!);
      setErro("");
      setSucesso(`Modelo "${modelo.nome}" excluído com sucesso.`);
      carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  const columns: Column<Modelo>[] = [
    { header: "Nome", render: (modelo) => modelo.nome },
    { header: "Ano", render: (modelo) => modelo.ano },
    { header: "Marca", render: (modelo) => marcas.find((marca) => marca.id === modelo.marcaId)?.nome ?? "-" },
    {
      header: "Categoria",
      render: (modelo) => categorias.find((categoria) => categoria.id === modelo.categoriaId)?.nome ?? "-",
    },
  ];

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Modelos</h1>
        <Button label="Novo modelo" onClick={() => navigate("/modelos/novo")} />
      </div>

      <Alert type="success" message={sucesso} onClose={() => setSucesso("")} />
      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      <Table
        columns={columns}
        data={modelos}
        onEdit={(modelo) => navigate(`/modelos/${modelo.id}`)}
        onDelete={(modelo) => setModeloParaExcluir(modelo)}
      />

      <Modal
        show={modeloParaExcluir !== null}
        title="Excluir modelo"
        confirmLabel="Excluir"
        onClose={() => setModeloParaExcluir(null)}
        onConfirm={excluir}
      >
        Deseja realmente excluir o modelo <strong>{modeloParaExcluir?.nome}</strong>?
      </Modal>
    </div>
  );
}
