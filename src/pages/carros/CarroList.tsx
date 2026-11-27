import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import type { Categoria } from "../../models/Categoria";
import type { Locacao } from "../../models/Locacao";
import type { Manutencao } from "../../models/Manutencao";
import type { Marca } from "../../models/Marca";
import type { Modelo } from "../../models/Modelo";
import { calcularSituacaoVeiculo, situacaoVeiculoLabel, type Veiculo } from "../../models/Veiculo";
import { dataHoje, formatarMoeda, mensagemDeErro } from "../../models/formatadores";
import { categoriaService } from "../../service/categoriaService";
import { locacaoService } from "../../service/locacaoService";
import { manutencaoService } from "../../service/manutencaoService";
import { marcaService } from "../../service/marcaService";
import { modeloService } from "../../service/modeloService";
import { veiculoService } from "../../service/veiculoService";

export const CarroList = () => {
  const navigate = useNavigate();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [diarias, setDiarias] = useState(3);
  const [abertos, setAbertos] = useState<string[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([
      modeloService.listar(),
      categoriaService.listar(),
      marcaService.listar(),
      veiculoService.listar(),
      locacaoService.listar(),
      manutencaoService.listar(),
    ])
      .then(([listaModelos, listaCategorias, listaMarcas, listaVeiculos, listaLocacoes, listaManutencoes]) => {
        setModelos(listaModelos);
        setCategorias(listaCategorias);
        setMarcas(listaMarcas);
        setVeiculos(listaVeiculos);
        setLocacoes(listaLocacoes);
        setManutencoes(listaManutencoes);
      })
      .catch((e: unknown) => setErro(mensagemDeErro(e)));
  }, []);

  const hoje = dataHoje();
  const quantidadeDiarias = diarias > 0 ? diarias : 1;

  const categoriaDoModelo = (modelo: Modelo): Categoria | undefined =>
    categorias.find((categoria) => categoria.id === modelo.categoriaId);

  const veiculosDoModelo = (modeloId: string): Veiculo[] =>
    veiculos.filter((veiculo) => veiculo.modeloId === modeloId);

  const situacao = (veiculo: Veiculo) => calcularSituacaoVeiculo(veiculo.id ?? "", locacoes, manutencoes, hoje);

  const disponiveis = (modeloId: string): number =>
    veiculosDoModelo(modeloId).filter((veiculo) => situacao(veiculo) === "DISPONIVEL").length;

  // "Mais alugado": modelo com mais locações registradas
  const locacoesDoModelo = (modeloId: string): number => {
    const ids = veiculosDoModelo(modeloId).map((veiculo) => veiculo.id);
    return locacoes.filter((locacao) => ids.includes(locacao.veiculoId)).length;
  };
  const maiorNumeroDeLocacoes = Math.max(0, ...modelos.map((modelo) => locacoesDoModelo(modelo.id ?? "")));

  // Ordena do menor para o maior valor de diária
  const modelosOrdenados = [...modelos].sort(
    (a, b) =>
      (categoriaDoModelo(a)?.valorLocacao ?? 0) - (categoriaDoModelo(b)?.valorLocacao ?? 0) ||
      a.nome.localeCompare(b.nome),
  );

  const alternar = (modeloId: string) => {
    setAbertos((atual) => (atual.includes(modeloId) ? atual.filter((id) => id !== modeloId) : [...atual, modeloId]));
  };

  return (
    <div className="container">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
        <div>
          <h1 className="h3 mb-1">Nossos carros</h1>
          <p className="text-muted mb-0">Escolha o modelo e veja quanto fica a locação.</p>
        </div>
        <div style={{ width: 180 }}>
          <Input
            label="Quantas diárias?"
            name="diarias"
            type="number"
            min={1}
            value={diarias}
            onChange={(event) => setDiarias(Number(event.target.value))}
          />
        </div>
      </div>

      <Alert type="danger" message={erro} onClose={() => setErro("")} />

      <div className="row g-4">
        {modelosOrdenados.map((modelo) => {
          const id = modelo.id ?? "";
          const categoria = categoriaDoModelo(modelo);
          const diaria = categoria?.valorLocacao ?? 0;
          const livres = disponiveis(id);
          const maisAlugado = maiorNumeroDeLocacoes > 0 && locacoesDoModelo(id) === maiorNumeroDeLocacoes;
          const aberto = abertos.includes(id);

          return (
            <div className="col-12 col-md-6 col-lg-4" key={id}>
              <div className={`card h-100 shadow-sm carro-riguilida${maisAlugado ? " carro-destaque" : ""}`}>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {categoria && <span className="etiqueta-categoria">{categoria.nome}</span>}
                    {maisAlugado && (
                      <span className="etiqueta-destaque">
                        <i className="bi bi-star-fill me-1" />
                        Mais alugado
                      </span>
                    )}
                  </div>

                  <h2 className="h4 nome-carro mb-0">{modelo.nome}</h2>
                  <p className="text-muted mb-3">
                    {marcas.find((marca) => marca.id === modelo.marcaId)?.nome} · {modelo.ano}
                  </p>

                  <p className="mb-3">
                    <i className={`bi bi-circle-fill me-2 small ${livres > 0 ? "text-success" : "text-secondary"}`} />
                    {livres > 0 ? `${livres} disponível(is) para retirada` : "Sem unidades livres agora"}
                  </p>

                  <div className="d-flex justify-content-between align-items-end border-top pt-3 mt-auto mb-3">
                    <div>
                      <span className="diaria">{formatarMoeda(diaria)}</span>
                      <span className="text-muted"> /dia</span>
                    </div>
                    <div className="text-end small">
                      <div className="text-muted">{quantidadeDiarias} diária(s)</div>
                      <strong>{formatarMoeda(diaria * quantidadeDiarias)}</strong>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <div className="flex-grow-1 d-grid">
                      <Button
                        label={livres > 0 ? "Alugar" : "Indisponível"}
                        disabled={livres === 0}
                        onClick={() => navigate(`/locacoes/nova?modelo=${id}&diarias=${quantidadeDiarias}`)}
                      />
                    </div>
                    <Button
                      label={aberto ? "Fechar" : "Ver unidades"}
                      variant="outline-secondary"
                      onClick={() => alternar(id)}
                    />
                  </div>

                  {aberto && (
                    <ul className="list-group list-group-flush mt-3">
                      {veiculosDoModelo(id).length === 0 && (
                        <li className="list-group-item px-0 text-muted">Nenhuma unidade cadastrada.</li>
                      )}
                      {veiculosDoModelo(id).map((veiculo) => {
                        const situacaoAtual = situacao(veiculo);
                        return (
                          <li
                            className="list-group-item px-0 d-flex justify-content-between align-items-center"
                            key={veiculo.id}
                          >
                            <span>
                              {veiculo.placa}
                              <small className="text-muted d-block">
                                {veiculo.cor} · {veiculo.kmRodado.toLocaleString("pt-BR")} km
                              </small>
                            </span>
                            <span
                              className={`badge ${situacaoAtual === "DISPONIVEL" ? "bg-success" : situacaoAtual === "LOCADO" ? "bg-primary" : "bg-warning text-dark"}`}
                            >
                              {situacaoVeiculoLabel[situacaoAtual]}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
