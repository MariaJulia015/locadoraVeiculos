import { Link, NavLink } from "react-router-dom";

const links = [
  { to: "/locacoes", label: "Locações" },
  { to: "/veiculos", label: "Veículos" },
  { to: "/clientes", label: "Clientes" },
  { to: "/manutencoes", label: "Manutenções" },
  { to: "/modelos", label: "Modelos" },
  { to: "/marcas", label: "Marcas" },
  { to: "/categorias", label: "Categorias" },
];

export const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Locadora de Veículos
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#menuPrincipal"
          aria-controls="menuPrincipal"
          aria-expanded="false"
          aria-label="Abrir menu"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="menuPrincipal">
          <ul className="navbar-nav ms-auto">
            {links.map((link) => (
              <li className="nav-item" key={link.to}>
                <NavLink className="nav-link" to={link.to}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
