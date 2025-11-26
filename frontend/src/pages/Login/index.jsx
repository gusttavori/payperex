import React, { useState } from 'react';
import { Loader2 } from 'lucide-react'; 
import api from '../../services/api'; 
import logo from '../../assets/Payperex.png'; 
import './Login.css';

export default function Login({ onLogin }) {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (accessCode.trim() === '') {
      setError("Por favor, digite um código.");
      return;
    }

    setLoading(true);

    try {
      // Agora só chamamos o LOGIN. 
      // O Backend vai identificar se é o código padrão ("1234") e liberar.
      const response = await api.post('/user/login', { accessCode });

      const { token, name, role } = response.data; // <--- Recebe o role
      
      localStorage.setItem('user_token', token);
      localStorage.setItem('user_name', name);
      localStorage.setItem('user_role', role); // <--- SALVA A ROLE AQUI
      
      onLogin(role);

    } catch (err) {
      if (err.response && err.response.data) {
        setError(typeof err.response.data === 'string' ? err.response.data : "Código inválido.");
      } else {
        setError("Erro de conexão com o servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent('Olá! Esqueci meu código de acesso ao Payperex e preciso de ajuda para recuperar.');

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Ajustei a classe para login-logo para pegar o CSS correto */}
        <img src={logo} alt="Payperex" className="login-logo" />
        
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="code" className="input-label">Código de Acesso</label>
          <input
            id="code"
            type="password" 
            placeholder="Digite seu código"
            className={`login-input ${error ? 'input-error' : ''}`}
            value={accessCode}
            onChange={(e) => { setAccessCode(e.target.value); setError(''); }}
            autoComplete="off"
          />

          <div className="forgot-container">
            <a href={`https://wa.me/5577988500087?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="forgot-code-link">Esqueceu seu código?</a>
          </div>

          {error && <span className="error-message">{error}</span>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20}/> : 'Acessar'}
          </button>
        </form>
        
      </div>
    </div>
  );
}