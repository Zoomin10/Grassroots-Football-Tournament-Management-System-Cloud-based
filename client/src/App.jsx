import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicView from "./pages/PublicView";
import AdminView from "./pages/AdminView";
import "./App.css";
import "./styles/public.css";

function App() {
  return (
    <BrowserRouter>
      {/* Header always visible */}
      <header className="app-title">
        <img
          src="/logos/wroughtonyouthfc.png"
          alt="Logo"
          className="title-logo"
        />
        <h1>Wroughton Youth FC</h1>
        <h1>Summer Tournament</h1>
      </header>

      <Routes>
        <Route path="/" element={<PublicView />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="*" element={<PublicView />} />
      </Routes>

      {/* Footer always visible */}
      <footer className="sponsor-footer">
        <h4>This WYFC tournament is proudly sponsored by:</h4>
        <div className="sponsor-logos">
          <img src="/sponsors/house.png" alt="house" />
          <img src="/sponsors/southby.png" alt="southby" />
          <img src="/sponsors/ajwaste.png" alt="ajwaste" />
          <img src="/sponsors/oceanescape.png" alt="oceanescape" />
          <img src="/sponsors/headstart.png" alt="headstart" />
          <img src="/sponsors/holloway.png" alt="holloway" />
          <img src="/sponsors/mjd.png" alt="mjd" />
        </div>
      </footer>
    </BrowserRouter>
  );
}

export default App;

