import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { ClienteForm } from "./pages/clientes/ClienteForm";
import { ClienteList } from "./pages/clientes/ClienteList";
import { LocacaoForm } from "./pages/locacoes/LocacaoForm";
import { LocacaoList } from "./pages/locacoes/LocacaoList";
import { ManutencaoForm } from "./pages/manutencoes/ManutencaoForm";
import { ManutencaoList } from "./pages/manutencoes/ManutencaoList";
import { VeiculoForm } from "./pages/veiculos/VeiculoForm";
import { VeiculoList } from "./pages/veiculos/VeiculoList";
import { CategoriaForm } from "./pages/categorias/CategoriaForm";
import { CategoriaList } from "./pages/categorias/CategoriaList";
import { MarcaForm } from "./pages/marcas/MarcaForm";
import { MarcaList } from "./pages/marcas/MarcaList";
import { ModeloForm } from "./pages/modelos/ModeloForm";
import { ModeloList } from "./pages/modelos/ModeloList";

function App() {
  return (
    <>
      <Navbar />
      <main className="pb-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/locacoes" element={<LocacaoList />} />
          <Route path="/locacoes/nova" element={<LocacaoForm />} />
          <Route path="/marcas" element={<MarcaList />} />
          <Route path="/marcas/novo" element={<MarcaForm />} />
          <Route path="/marcas/:id" element={<MarcaForm />} />
          <Route path="/categorias" element={<CategoriaList />} />
          <Route path="/categorias/novo" element={<CategoriaForm />} />
          <Route path="/categorias/:id" element={<CategoriaForm />} />
          <Route path="/modelos" element={<ModeloList />} />
          <Route path="/modelos/novo" element={<ModeloForm />} />
          <Route path="/modelos/:id" element={<ModeloForm />} />
          <Route path="/veiculos" element={<VeiculoList />} />
          <Route path="/veiculos/novo" element={<VeiculoForm />} />
          <Route path="/veiculos/:id" element={<VeiculoForm />} />
          <Route path="/manutencoes" element={<ManutencaoList />} />
          <Route path="/manutencoes/novo" element={<ManutencaoForm />} />
          <Route path="/manutencoes/:id" element={<ManutencaoForm />} />
          <Route path="/clientes" element={<ClienteList />} />
          <Route path="/clientes/novo" element={<ClienteForm />} />
          <Route path="/clientes/:id" element={<ClienteForm />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
