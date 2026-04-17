import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // Dashboard das Unidades
import DashboardMaster from './pages/DashboardMaster'; // Dashboard Mestre
import InstallPrompt from './components/InstallPrompt'; // <--- Importação do componente PWA

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    const role = localStorage.getItem('user_role');
    
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole(null);
  };

  // Função auxiliar para decidir qual tela renderizar
  const renderScreen = () => {
    if (isAuthenticated) {
      // SE FOR MESTRE, MOSTRA A TELA GERAL
      if (userRole === 'master') {
        return <DashboardMaster onLogout={handleLogout} />;
      }
      // SE FOR UNIDADE, MOSTRA O DASHBOARD COMUM
      return <Dashboard onLogout={handleLogout} />;
    }

    // SE NÃO ESTIVER LOGADO, MOSTRA O LOGIN
    return <Login onLogin={handleLogin} />;
  };

  return (
    <>
      {/* O sistema carrega a tela correspondente aqui */}
      {renderScreen()}

      {/* O pop-up do PWA fica flutuando globalmente por cima de tudo */}
      <InstallPrompt />
    </>
  );
}

export default App;