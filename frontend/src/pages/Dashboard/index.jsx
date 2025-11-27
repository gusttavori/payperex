import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LogOut, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  MessageCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

import logo from '../../assets/Payperex.png'; 
import api from '../../services/api';
import Historico from './HistoricoMensal'; // CORRETO (H maiúsculo)
import TransactionModal from './TransactionModal';
import './Dashboard.css';

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('entrada');
  const [transactions, setTransactions] = useState([]);
  
  // NOVO: Estado para guardar o nome da unidade logada
  const [userName, setUserName] = useState('');

  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const loadData = useCallback(async () => {
    try {
      const response = await api.get('/transactions');
      const data = response.data;
      
      setTransactions(data);

      const income = data
        .filter(t => t.type === 'entrada')
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

      const expense = data
        .filter(t => t.type === 'saida')
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

      setSummary({
        income,
        expense,
        balance: income - expense
      });

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Pega o nome salvo no Login
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setUserName(storedName);
    } else {
      setUserName('Unidade Desconhecida');
    }
  }, [loadData]);

  // --- LÓGICA DOS GRÁFICOS ---

  const comparisonData = useMemo(() => [
    { name: 'Entradas', value: summary.income },
    { name: 'Saídas', value: summary.expense },
  ], [summary]);

  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'saida');
    
    const grouped = expenses.reduce((acc, curr) => {
      const catName = curr.category || 'Outros';
      const val = Number(curr.amount) || 0;

      if (!acc[catName]) acc[catName] = 0;
      acc[catName] += val;
      return acc;
    }, {});

    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key]
    }));
  }, [transactions]);

  const evolutionData = useMemo(() => {
    if (transactions.length === 0) return [];

    const grouped = transactions.reduce((acc, curr) => {
      const d = new Date(curr.date);
      if (isNaN(d.getTime())) return acc; 

      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const val = Number(curr.amount) || 0;
      
      if (!acc[label]) {
        acc[label] = { 
          name: label, 
          rawDate: d, 
          entrada: 0, 
          saida: 0 
        };
      }

      if (curr.type === 'entrada') acc[label].entrada += val;
      else acc[label].saida += val;

      return acc;
    }, {});

    const result = Object.values(grouped).sort((a, b) => a.rawDate - b.rawDate);
    return result; 
  }, [transactions]);


  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <header className="dashboard-header">
        <div style={{justifySelf: 'start'}}>
          {/* Mostra o nome dinâmico da unidade */}
          <span className="user-code" style={{textTransform: 'uppercase'}}>
            {userName}
          </span>
        </div>
        
        <div style={{justifySelf: 'center'}}>
          <img 
            src={logo} 
            alt="Payperex" 
            className="dashboard-logo"
            style={{ height: '40px', marginBottom: 0 }} 
          />
        </div>

        <div style={{justifySelf: 'end'}}>
          <button className="logout-button" onClick={onLogout}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      {/* NAVEGAÇÃO */}
      <div className="nav-tabs">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`nav-item ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          Histórico
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* CARD DO SALDO (Com Cores Dinâmicas) */}
          <div 
            className="balance-card"
            style={{
              // Borda Verde se >= 0, Vermelha se < 0
              border: `2px solid ${summary.balance >= 0 ? '#22c55e' : '#ef4444'}`,
            }}
          >
            <div className="balance-header">
              <Wallet size={20} />
              <span>Saldo Atual</span>
            </div>
            
            {/* Texto Verde se >= 0, Vermelho se < 0 */}
            <div 
              className="balance-value" 
              style={{ color: summary.balance >= 0 ? '#22c55e' : '#ef4444' }}
            >
               {formatCurrency(summary.balance)}
            </div>
            <div className="balance-footer">Total acumulado</div>
          </div>

          <div className="summary-grid">
            <div className="summary-card income">
              <div className="card-header">
                <span>Total Entradas</span>
                <TrendingUp size={20} color="#22c55e" />
              </div>
              <div className="summary-value">
                {formatCurrency(summary.income)}
              </div>
            </div>

            <div className="summary-card expense">
              <div className="card-header">
                <span>Total Saídas</span>
                <TrendingDown size={20} color="#ef4444" />
              </div>
              <div className="summary-value">
                {formatCurrency(summary.expense)}
              </div>
            </div>
          </div>

          <div className="actions-grid">
            <button className="action-button income" onClick={() => handleOpenModal('entrada')}>
              <Plus size={20} /> Adicionar Entrada
            </button>
            <button className="action-button expense" onClick={() => handleOpenModal('saida')}>
              <Plus size={20} /> Adicionar Saída
            </button>
          </div>

          {/* ÁREA DOS GRÁFICOS */}
          <div className="charts-row">
            
            {/* 1. BARRAS */}
            <div className="chart-card">
              <h3 className="chart-title">Entradas x Saídas</h3>
              <div className="chart-content" style={{ width: '100%', height: 300, minHeight: 300, display: 'block' }}>
                {(summary.income === 0 && summary.expense === 0) ? (
                  <div className="placeholder-box">Adicione transações para ver o gráfico</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: 'transparent'}} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {comparisonData.map((entry, i) => (
                          <Cell key={i} fill={entry.name === 'Entradas' ? '#22c55e' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 2. PIZZA */}
            <div className="chart-card">
              <h3 className="chart-title">Gastos por Categoria</h3>
              <div className="chart-content" style={{ width: '100%', height: 300, minHeight: 300, display: 'block' }}>
                {categoryData.length === 0 ? (
                  <div style={{height: '100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8'}}>
                    Nenhum gasto registrado
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {categoryData.length > 0 && (
                <div className="chart-legend" style={{flexWrap: 'wrap'}}>
                  {categoryData.map((entry, i) => (
                    <div key={i} className="legend-item">
                      <span className="dot" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                      {entry.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. EVOLUÇÃO */}
          <div className="chart-card full-width-chart">
            <h3 className="chart-title">Evolução Financeira</h3>
            <div className="chart-content" style={{ width: '100%', height: 400, minHeight: 400, display: 'block' }}>
              {evolutionData.length === 0 ? (
                <div style={{height: '100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8'}}>
                   Nenhuma transação registrada
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="entrada" stroke="#22c55e" fillOpacity={1} fill="url(#colorEntrada)" name="Entradas" />
                    <Area type="monotone" dataKey="saida" stroke="#ef4444" fillOpacity={1} fill="url(#colorSaida)" name="Saídas" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'historico' && <Historico />}

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        initialType={modalType}
        onSuccess={loadData} 
      />

      <a 
        href="https://wa.me/5577988500087" 
        className="floating-whatsapp"
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}

// FORÇANDO ATUALIZAÇÃO DO GIT