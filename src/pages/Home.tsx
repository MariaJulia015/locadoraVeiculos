import { Link } from "react-router-dom";

const atalhos = [
  { to: "/locacoes/nova", titulo: "Nova locação", texto: "Registrar a retirada de um veículo." },
  { to: "/locacoes", titulo: "Locações", texto: "Consultar, devolver, pagar e emitir nota fiscal." },
  { to: "/veiculos", titulo: "Veículos", texto: "Frota e situação de cada veículo." },
  { to: "/clientes", titulo: "Clientes", texto: "Dados pessoais e habilitação." },
];

export const Home = () => {
  return (
    <div className="container">
      <div className="banner-riguilida text-center p-4 mb-4">
        <img src="/logo-riguilida.png" alt="Riguilida - Locadora de Carros" width={620} />
        <p className="text-white-50 mt-3 mb-0">Controle da frota, dos clientes e de todo o ciclo de uma locação.</p>
      </div>
      <div className="row g-3">
        {atalhos.map((atalho) => (
          <div className="col-12 col-sm-6 col-lg-3" key={atalho.to}>
            <Link to={atalho.to} className="card h-100 shadow-sm text-decoration-none text-reset atalho-riguilida">
              <div className="card-body">
                <h2 className="h5">{atalho.titulo}</h2>
                <p className="card-text text-muted mb-0">{atalho.texto}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
