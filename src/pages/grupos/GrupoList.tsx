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

export const GrupoList = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [diarias, setDiarias] = useState(3);
  const [detalhesAbertos, setDetalhesAbertos] = useState<string[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([
      categoriaService.listar(),
      modeloService.listar(),
      marcaService.listar(),
      veiculoService.listar(),
      locacaoService.listar(),
      manutencaoService.listar(),
    ])
      .then(([listaCategorias, listaModelos, listaMarcas, listaVeiculos, listaLocacoes, listaManutencoes]) => {
        setCategorias([...listaCategorias].sort((a, b) => a.valorLocacao - b.valorLocacao));
        setModelos(listaModelos);
        setMarcas(listaMarcas);
        setVeiculos(listaVeiculos);
        setLocacoes(listaLocacoes);
        setManutencoes(listaManutencoes);
      })
      .catch((e: unknown) => setErro(mensagemDeErro(e)));
  }, []);

  const hoje = dataHoje();
  const quantidadeDiarias = diarias > 0 ? diarias : 1;

  const modelosDoGrupo = (categoriaId: string): Modelo[] =>
    modelos.filter((modelo) => modelo.categoriaId === categoriaId);

  const veiculosDoGrupo = (categoriaId: string): Veiculo[] => {
    const idsModelos = modelosDoGrupo(categoriaId).map((modelo) => modelo.id);
    return veiculos.filter((veiculo) => idsModelos.includes(veiculo.modeloId));
  };

  const situacao = (veiculo: Veiculo) => calcularSituacaoVeiculo(veiculo.id ?? "", locacoes, manutencoes, hoje);

  const disponiveisNoGrupo = (categoriaId: string): number =>
    veiculosDoGrupo(categoriaId).filter((veiculo) => situacao(veiculo) === "DISPONIVEL").length;

  // Título no estilo "VW GOL, CHEVROLET ONIX OU SIMILAR*"
  const tituloDoGrupo = (categoriaId: string): string => {
    const nomes = modelosDoGrupo(categoriaId).map((modelo) => {
      const marca = marcas.find((item) => item.id === modelo.marcaId)?.nome;
      return `${marca ? `${marca} ` : ""}${modelo.nome}`;
    });
    if (nomes.length === 0) return "Nenhum modelo cadastrado";
    return `${nomes.join(", ")} ou similar*`;
  };

  // "Preferido do público": grupo com mais locações registradas
  const locacoesPorGrupo = (categoriaId: string): number => {
    const idsVeiculos = veiculosDoGrupo(categoriaId).map((veiculo) => veiculo.id);
    return locacoes.filter((locacao) => idsVeiculos.includes(locacao.veiculoId)).length;
  };
  const maiorNumeroDeLocacoes = Math.max(0, ...categorias.map((categoria) => locacoesPorGrupo(categoria.id ?? "")));

  const alternarDetalhes = (categoriaId: string) => {
    setDetalhesAbertos((atual) =>
      atual.includes(categoriaId) ? atual.filter((id) => id !== categoriaId) : [...atual, categoriaId],
    );
  };

  const escolherGrupo = (categoriaId: string) => {
    navigate(`/locacoes/nova?categoria=${categoriaId}&diarias=${quantidadeDiarias}`);
  };

  return (
    <div className="container">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
        <div>
          <h1 className="h3 mb-1">Escolha o grupo</h1>
          <p className="text-muted mb-0">Valores por diária de cada grupo da frota Riguilida.</p>
        </div>
        <div style={{ width: 180 }}>
          <Input
            label="Quantidade de diárias"
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
        {categorias.map((categoria) => {
          const id = categoria.id ?? "";
          const disponiveis = disponiveisNoGrupo(id);
          const preferido = maiorNumeroDeLocacoes > 0 && locacoesPorGrupo(id) === maiorNumeroDeLocacoes;
          const aberto = detalhesAbertos.includes(id);

          return (
            <div className="col-12 col-md-6 col-xl-4" key={id}>
              <div className={`card h-100 shadow-sm grupo-riguilida${preferido ? " grupo-preferido" : ""}`}>
                <div className="card-body d-flex flex-column">
                  {preferido && (
                    <div className="selo-preferido mb-3">
                      <i className="bi bi-patch-check-fill me-2" />
                      Preferido do público
                    </div>
                  )}

                  <h2 className="h6 text-uppercase fw-bold titulo-grupo mb-1">{tituloDoGrupo(id)}</h2>
                  <p className="text-muted mb-3">Grupo {categoria.nome}</p>

                  <div className="preco-grupo text-center p-3 mb-3">
                    <div className="text-muted">A partir de</div>
                    <div>
                      <span className="me-1">R$</span>
                      <span className="valor-diaria">
                        {categoria.valorLocacao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="ms-1">/Dia</span>
                    </div>
                    <div className="fw-semibold">
                      {formatarMoeda(categoria.valorLocacao * quantidadeDiarias)} /Total em {quantidadeDiarias} diária(s)
                    </div>
                    <small className="text-muted d-block mt-2">
                      Valor sem taxas adicionais. O total final é calculado na devolução.
                    </small>
                  </div>

                  <p className="mb-3">
                    <i className={`bi bi-car-front me-2 ${disponiveis > 0 ? "text-success" : "text-danger"}`} />
                    {disponiveis > 0
                      ? `${disponiveis} veículo(s) disponível(is) agora`
                      : "Nenhum veículo disponível no momento"}
                  </p>

                  <div className="mt-auto d-grid gap-2">
                    <Button
                      label={disponiveis > 0 ? "Escolher grupo" : "Grupo indisponível"}
                      size="lg"
                      disabled={disponiveis === 0}
                      onClick={() => escolherGrupo(id)}
                    />
                    <Button
                      label={aberto ? "Ocultar detalhes" : "Mostrar detalhes"}
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => alternarDetalhes(id)}
                    />
                  </div>

                  {aberto && (
                    <ul className="list-group list-group-flush mt-3">
                      {veiculosDoGrupo(id).length === 0 && (
                        <li className="list-group-item px-0 text-muted">Nenhum veículo cadastrado neste grupo.</li>
                      )}
                      {veiculosDoGrupo(id).map((veiculo) => {
                        const modelo = modelos.find((item) => item.id === veiculo.modeloId);
                        const situacaoAtual = situacao(veiculo);
                        return (
                          <li
                            className="list-group-item px-0 d-flex justify-content-between align-items-center"
                            key={veiculo.id}
                          >
                            <span>
                              {modelo?.nome} {modelo?.ano} · {veiculo.cor}
                              <small className="text-muted d-block">{veiculo.placa}</small>
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

      <p className="text-muted small mt-4">
        *O veículo é definido na retirada, conforme a disponibilidade do grupo escolhido.
      </p>
    </div>
  );
};
