import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { useApp } from "./hooks/useApp";
import Sidebar from "./components/Sidebar";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import { CallOverlay, CallsPage, CommunitiesPage, SettingsPage, StatusPage } from "./pages/FeaturePages";
import "./app.css";

function PrivateApp() {
  const { data, updateData, updateSettings, updateProfile, signOut } = useApp();
  const [activeTab, setActiveTab] = useState("chats");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [call, setCall] = useState(null);
  const [systemTheme, setSystemTheme] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const navigate = useNavigate();
  const theme = data.settings.theme === "system"
    ? systemTheme
    : data.settings.theme;

  useEffect(() => {
    const openCall = (event) => {
      const target = event.detail?.chat;
      setCall({ name: target?.name || "Contact", color: target?.color || "#178c70", kind: event.detail?.kind || "voice" });
    };
    window.addEventListener("start-call", openCall);
    return () => window.removeEventListener("start-call", openCall);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onThemeChange = (event) => setSystemTheme(event.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", onThemeChange);
    return () => mediaQuery.removeEventListener("change", onThemeChange);
  }, []);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === "Escape" && call) setCall(null);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [call]);

  function logout() {
    signOut();
    navigate("/login", { replace: true });
  }

  return <div className={`app-shell theme-${theme} font-${data.settings.fontSize} ${mobileOpen && activeTab === "chats" ? "mobile-chat-open" : ""}`} data-theme={theme}>
    <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setMobileOpen(false); }} profile={data.profile} onLogout={logout} />
    <main className="workspace">
      {activeTab === "chats" && <ChatPage data={data} updateData={updateData} profile={data.profile} onMobileOpen={setMobileOpen} />}
      {activeTab === "status" && <StatusPage data={data} updateData={updateData} />}
      {activeTab === "calls" && <CallsPage data={data} updateData={updateData} startCall={setCall} />}
      {activeTab === "communities" && <CommunitiesPage data={data} updateData={updateData} />}
      {activeTab === "settings" && <SettingsPage data={data} updateSettings={updateSettings} updateProfile={updateProfile} onLogout={logout} />}
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation">{[["chats", "Chats"], ["status", "Status"], ["calls", "Calls"], ["communities", "Communities"], ["settings", "Settings"]].map(([id, title]) => <button key={id} className={activeTab === id ? "mobile-nav-active" : ""} onClick={() => { setActiveTab(id); setMobileOpen(false); }} aria-label={title}><span>{id === "chats" ? "◉" : id === "status" ? "◷" : id === "calls" ? "⌕" : id === "communities" ? "♧" : "⚙"}</span><small>{title}</small></button>)}</nav>
    {call && <CallOverlay call={call} onEnd={(seconds) => { const duration = `${Math.floor(seconds / 60)} min`; updateData((current) => ({ ...current, calls: [{ id: `call-${Date.now()}`, name: call.name, kind: call.kind, direction: "outgoing", createdAt: new Date().toISOString(), duration: seconds ? duration : "" }, ...current.calls] })); setCall(null); }} />}
  </div>;
}

function AppRoutes() {
  const { data } = useApp();
  return <Routes>
    <Route path="/" element={<Navigate to={data.session ? "/app" : "/login"} replace />} />
    <Route path="/login" element={data.session ? <Navigate to="/app" replace /> : <AuthPage mode="login" />} />
    <Route path="/signup" element={data.session ? <Navigate to="/app" replace /> : <AuthPage mode="signup" />} />
    <Route path="/app/*" element={data.session ? <PrivateApp /> : <Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

export default function App() {
  return <BrowserRouter><AppProvider><AppRoutes /></AppProvider></BrowserRouter>;
}
