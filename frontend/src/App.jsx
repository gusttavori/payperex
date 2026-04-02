import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // Dashboard das Unidades
import DashboardMaster from './pages/DashboardMaster'; // <--- Vamos criar agora

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

  if (isAuthenticated) {
    // SE FOR MESTRE, MOSTRA A TELA GERAL
    if (userRole === 'master') {
      return <DashboardMaster onLogout={handleLogout} />;
    }
    // SE FOR UNIDADE, MOSTRA O DASHBOARD COMUM
    return <Dashboard onLogout={handleLogout} />;
  }

  return <Login onLogin={handleLogin} />;
}

export default App;