import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import PublicView from "./pages/PublicView";
import AdminView from "./pages/AdminView";
import LargeScreenView from "./pages/LargeScreenView";
import RegisterPage from "./pages/RegisterPage";


import "./App.css";
import "./styles/public.css";
import "./styles/tv.css";

function Layout({ children }) {
  const location = useLocation();
  const isTV = location.pathname === "/tv";
  const isRegister = location.pathname.startsWith("/register");


  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!isTV) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [isTV]);

  return (
    <div className={isTV ? "tv-page" : ""}>
      {/* Header */}
      {isTV ? (
        <header className="tv-header">
          <div className="tv-title-box">
            <img
              src="/logos/wroughtonyouthfc.png"
              alt="WYFC Logo"
              className="tv-logo"
            />
            <div className="tv-title-line">
              Wroughton Youth FC – Live Tournament Updates
            </div>
          </div>

          <div className="tv-clock">
            {now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
        </header>
      ) : (
        <header className="app-title">
          <img
            src="/logos/wroughtonyouthfc.png"
            alt="Logo"
            className="title-logo"
          />
          <h1>Wroughton Youth FC</h1>
            <h1>{isRegister ? "Tournament Registration" : "Summer Tournament"}</h1>
        </header>
      )}

      {/* Page content */}
      <div className={isTV ? "tv-content" : ""}>{children}</div>

      {/* Footer */}
      {isTV ? (
        <footer className="tv-sponsor-footer">
          <div className="tv-sponsor-text">Proudly sponsored by</div>
          <div className="tv-sponsor-logos">
            <img src="/sponsors/house.png" alt="house" />
            <img src="/sponsors/southby.png" alt="southby" />
            <img src="/sponsors/ajwaste.png" alt="ajwaste" />
            <img src="/sponsors/oceanescape.png" alt="oceanescape" />
            <img src="/sponsors/headstart.png" alt="headstart" />
            <img src="/sponsors/holloway.png" alt="holloway" />
            <img src="/sponsors/mjd.png" alt="mjd" />
          </div>
        </footer>
      ) : (
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
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PublicView />} />
          <Route path="/admin" element={<AdminView />} />
          <Route path="/tv" element={<LargeScreenView />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<PublicView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
