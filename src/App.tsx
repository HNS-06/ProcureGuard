import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ToastProvider } from "./components/ToastProvider";
import { CommandPaletteProvider } from "./components/CommandPalette";
import { Dashboard } from "./pages/Dashboard";
import { SubmitRequest } from "./pages/SubmitRequest";
import { RequestDetail } from "./pages/RequestDetail";
import { AllRequests } from "./pages/AllRequests";
import { Login } from "./pages/Login";
import { UserProvider, useUser } from "./auth/UserContext";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};

const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen w-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900/15">
        <Header />
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-10">
          <div className="max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/submit" element={<SubmitRequest />} />
              <Route path="/requests" element={<AllRequests />} />
              <Route path="/requests/:id" element={<RequestDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <ToastProvider>
          <CommandPaletteProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              />
            </Routes>
          </CommandPaletteProvider>
        </ToastProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
