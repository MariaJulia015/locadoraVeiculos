import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import type { Categoria } from "../../models/Categoria";
import type { Marca } from "../../models/Marca";
import type { Modelo } from "../../models/Modelo";
import type { Veiculo } from "../../models/Veiculo";
import { formatarMoeda, mensagemDeErro } from "../../models/formatadores";
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
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modeloParaExcluir, setModeloParaExcluir] = useState<Modelo | null>(null);
  const [sucesso, setSucesso] = useState<string>((location.state as { mensagem?: string } | null)?.mensagem ?? "");
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      const [listaModelos, listaMarcas, listaCategorias, listaVeiculos] = await Promise.all([
        modeloService.listar(),
        marcaService.listar(),
        categoriaService.listar(),
        veiculoService.listar(),
      ]);
      setVeiculos(listaVeiculos);
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

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-1">Modelos</h1>
          <p className="text-muted mb-0">Modelos de carro da frota, com marca, categoria e diária.</p>
        </div>
        <Button label="Novo modelo" onClick={() => navigate("/modelos/novo")} />
      </div>

      <Alert type="success" message={sucesso} onClose={() => setSucesso("")} />
      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      {modelos.length === 0 && <p className="text-muted">Nenhum modelo cadastrado.</p>}

      <div className="row g-4">
        {modelos.map((modelo) => {
          const marca = marcas.find((item) => item.id === modelo.marcaId);
          const categoria = categorias.find((item) => item.id === modelo.categoriaId);
          const unidades = veiculos.filter((veiculo) => veiculo.modeloId === modelo.id).length;

          return (
            <div className="col-12 col-md-6 col-lg-4" key={modelo.id}>
              <div className="card h-100 shadow-sm carro-riguilida">
                <div className="card-body d-flex flex-column">
                  <div className="mb-3">
                    {categoria && <span className="etiqueta-categoria">{categoria.nome}</span>}
                  </div>

                  <h2 className="h4 nome-carro mb-0">{modelo.nome}</h2>
                  <p className="text-muted mb-3">
                    {marca?.nome ?? "-"} · {modelo.ano}
                  </p>

                  <div className="d-flex justify-content-between border-top pt-3 mt-auto mb-3">
                    <div>
                      <small className="text-muted d-block">Diária da categoria</small>
                      <strong>{categoria ? formatarMoeda(categoria.valorLocacao) : "-"}</strong>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">Unidades na frota</small>
                      <strong>{unidades}</strong>
                    </div>
                  </div>

                  <div className="d-flex gap-2 justify-content-end">
                    <Button label="Editar" variant="warning" size="sm" onClick={() => navigate(`/modelos/${modelo.id}`)} />
                    <Button label="Excluir" variant="danger" size="sm" onClick={() => setModeloParaExcluir(modelo)} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
