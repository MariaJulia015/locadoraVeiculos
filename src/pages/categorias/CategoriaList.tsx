import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Table, type Column } from "../../components/Table";
import type { Categoria } from "../../models/Categoria";
import { formatarMoeda, mensagemDeErro } from "../../models/formatadores";
import { categoriaService } from "../../service/categoriaService";
import { modeloService } from "../../service/modeloService";

export const CategoriaList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<Categoria | null>(null);
  const [sucesso, setSucesso] = useState<string>((location.state as { mensagem?: string } | null)?.mensagem ?? "");
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setCategorias(await categoriaService.listar());
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const excluir = async () => {
    if (!categoriaParaExcluir?.id) return;
    const categoria = categoriaParaExcluir;
    setCategoriaParaExcluir(null);
    try {
      const modelos = await modeloService.listar();
      const vinculados = modelos.filter((modelo) => modelo.categoriaId === categoria.id);
      if (vinculados.length > 0) {
        setSucesso("");
        setErro(
          `Não é possível excluir a categoria "${categoria.nome}": existem ${vinculados.length} modelo(s) vinculado(s) a ela.`,
        );
        return;
      }
      await categoriaService.excluir(categoria.id!);
      setErro("");
      setSucesso(`Categoria "${categoria.nome}" excluída com sucesso.`);
      carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  const columns: Column<Categoria>[] = [
    { header: "Nome", render: (categoria) => categoria.nome },
    { header: "Valor da diária", render: (categoria) => formatarMoeda(categoria.valorLocacao) },
  ];

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Categorias</h1>
        <Button label="Nova categoria" onClick={() => navigate("/categorias/novo")} />
      </div>

      <Alert type="success" message={sucesso} onClose={() => setSucesso("")} />
      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      <Table
        columns={columns}
        data={categorias}
        onEdit={(categoria) => navigate(`/categorias/${categoria.id}`)}
        onDelete={(categoria) => setCategoriaParaExcluir(categoria)}
      />

      <Modal
        show={categoriaParaExcluir !== null}
        title="Excluir categoria"
        confirmLabel="Excluir"
        onClose={() => setCategoriaParaExcluir(null)}
        onConfirm={excluir}
      >
        Deseja realmente excluir a categoria <strong>{categoriaParaExcluir?.nome}</strong>?
      </Modal>
    </div>
  );
}
