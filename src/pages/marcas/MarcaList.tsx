import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Table, type Column } from "../../components/Table";
import type { Marca } from "../../models/Marca";
import { mensagemDeErro } from "../../models/formatadores";
import { marcaService } from "../../service/marcaService";
import { modeloService } from "../../service/modeloService";

export const MarcaList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [marcaParaExcluir, setMarcaParaExcluir] = useState<Marca | null>(null);
  const [sucesso, setSucesso] = useState<string>((location.state as { mensagem?: string } | null)?.mensagem ?? "");
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setMarcas(await marcaService.listar());
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const excluir = async () => {
    if (!marcaParaExcluir?.id) return;
    const marca = marcaParaExcluir;
    setMarcaParaExcluir(null);
    try {
      const modelos = await modeloService.listar();
      const vinculados = modelos.filter((modelo) => modelo.marcaId === marca.id);
      if (vinculados.length > 0) {
        setSucesso("");
        setErro(`Não é possível excluir a marca "${marca.nome}": existem ${vinculados.length} modelo(s) vinculado(s) a ela.`);
        return;
      }
      await marcaService.excluir(marca.id!);
      setErro("");
      setSucesso(`Marca "${marca.nome}" excluída com sucesso.`);
      carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  const columns: Column<Marca>[] = [{ header: "Nome", render: (marca) => marca.nome }];

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Marcas</h1>
        <Button label="Nova marca" onClick={() => navigate("/marcas/novo")} />
      </div>

      <Alert type="success" message={sucesso} onClose={() => setSucesso("")} />
      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      <Table
        columns={columns}
        data={marcas}
        onEdit={(marca) => navigate(`/marcas/${marca.id}`)}
        onDelete={(marca) => setMarcaParaExcluir(marca)}
      />

      <Modal
        show={marcaParaExcluir !== null}
        title="Excluir marca"
        confirmLabel="Excluir"
        onClose={() => setMarcaParaExcluir(null)}
        onConfirm={excluir}
      >
        Deseja realmente excluir a marca <strong>{marcaParaExcluir?.nome}</strong>?
      </Modal>
    </div>
  );
}
