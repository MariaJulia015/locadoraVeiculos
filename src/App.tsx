import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
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
          <Route path="/marcas" element={<MarcaList />} />
          <Route path="/marcas/novo" element={<MarcaForm />} />
          <Route path="/marcas/:id" element={<MarcaForm />} />
          <Route path="/categorias" element={<CategoriaList />} />
          <Route path="/categorias/novo" element={<CategoriaForm />} />
          <Route path="/categorias/:id" element={<CategoriaForm />} />
          <Route path="/modelos" element={<ModeloList />} />
          <Route path="/modelos/novo" element={<ModeloForm />} />
          <Route path="/modelos/:id" element={<ModeloForm />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
