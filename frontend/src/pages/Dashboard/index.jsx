import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LogOut,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  MessageCircle,
  Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

import logo from '../../assets/Payperex.png';
import api from '../../services/api';
import Historico from './HistoricoMensal';
import TransactionModal from './TransactionModal';
import './Dashboard.css';

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('entrada');
  const [transactions, setTransactions] = useState([]);
  const [userName, setUserName] = useState('');

  // --- ESTADOS DOS FILTROS ---
  const [filterMode, setFilterMode] = useState('mes');

  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [filterPeriod, setFilterPeriod] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // 1. CARREGA OS DADOS BRUTOS
  const loadData = useCallback(async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setUserName(storedName);
    } else {
      setUserName('Unidade Desconhecida');
    }
  }, [loadData]);

  // 2. FILTRA OS DADOS GLOBALMENTE
  // Essa lista será a base para TODOS os cards e gráficos
  const filteredTransactions = useMemo(() => {
    return transactions.filter(curr => {
      const d = new Date(curr.date);
      if (isNaN(d.getTime())) return false;

      if (filterMode === 'mes') {
        if (!filterMonth) return true;
        const [year, month] = filterMonth.split('-');
        return d.getFullYear() === parseInt(year, 10) && d.getMonth() === (parseInt(month, 10) - 1);
      } else {
        if (!filterPeriod.start || !filterPeriod.end) return true;
        const start = new Date(`${filterPeriod.start}T00:00:00`);
        const end = new Date(`${filterPeriod.end}T23:59:59`);
        return d >= start && d <= end;
      }
    });
  }, [transactions, filterMode, filterMonth, filterPeriod]);

  // 3. CALCULA O RESUMO (SALDO, ENTRADAS, SAÍDAS) BASEADO NO FILTRO
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'entrada')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const expense = filteredTransactions
      .filter(t => t.type === 'saida')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    return {
      income,
      expense,
      balance: income - expense
    };
  }, [filteredTransactions]);

  // 4. PREPARA OS DADOS DOS GRÁFICOS
  const comparisonData = useMemo(() => [
    { name: 'Entradas', value: summary.income },
    { name: 'Saídas', value: summary.expense },
  ], [summary]);

  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'saida');

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
  }, [filteredTransactions]);

  const evolutionData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    const grouped = filteredTransactions.reduce((acc, curr) => {
      const d = new Date(curr.date);
      const val = Number(curr.amount) || 0;
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      if (!acc[label]) {
        acc[label] = {
          name: label,
          rawDate: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
          entrada: 0,
          saida: 0
        };
      }

      if (curr.type === 'entrada') acc[label].entrada += val;
      else acc[label].saida += val;

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => a.rawDate - b.rawDate);
  }, [filteredTransactions]);

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
      <header className="dashboard-header">
        <div style={{ justifySelf: 'start' }}>
          <span className="user-code" style={{ textTransform: 'uppercase' }}>
            {userName}
          </span>
        </div>

        <div style={{ justifySelf: 'center' }}>
          <img
            src={logo}
            alt="Payperex"
            className="dashboard-logo"
            style={{ height: '40px', marginBottom: 0 }}
          />
        </div>

        <div style={{ justifySelf: 'end' }}>
          <button className="logout-button" onClick={onLogout}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

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
          {/* BARRA DE FILTROS GLOBAL */}
          <div className="dashboard-controls">
            <div className="filter-title">
              <Calendar size={18} color="#64748b" />
              <span>Período de Análise:</span>
            </div>
            <div className="filter-group">
              <select
                className="custom-select"
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
              >
                <option value="mes">Por Mês</option>
                <option value="periodo">Por Período</option>
              </select>

              {filterMode === 'mes' ? (
                <input
                  type="month"
                  className="custom-input"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                />
              ) : (
                <div className="date-range-group">
                  <input
                    type="date"
                    className="custom-input"
                    value={filterPeriod.start}
                    onChange={(e) => setFilterPeriod({ ...filterPeriod, start: e.target.value })}
                  />
                  <span className="filter-separator">até</span>
                  <input
                    type="date"
                    className="custom-input"
                    value={filterPeriod.end}
                    onChange={(e) => setFilterPeriod({ ...filterPeriod, end: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          <div
            className="balance-card"
            style={{ border: `2px solid ${summary.balance >= 0 ? '#22c55e' : '#ef4444'}` }}
          >
            <div className="balance-header">
              <Wallet size={20} />
              <span>Saldo do Período</span>
            </div>

            <div
              className="balance-value"
              style={{ color: summary.balance >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {formatCurrency(summary.balance)}
            </div>
            <div className="balance-footer">Considerando apenas as datas selecionadas acima</div>
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

          <div className="charts-row">
            <div className="chart-card">
              <h3 className="chart-title">Entradas x Saídas</h3>
              <div className="chart-content" style={{ width: '100%', height: 300, minHeight: 300, display: 'block' }}>
                {(summary.income === 0 && summary.expense === 0) ? (
                  <div className="placeholder-box">Nenhuma transação no período</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} />
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

            <div className="chart-card">
              <h3 className="chart-title">Gastos por Categoria</h3>
              <div className="chart-content" style={{ width: '100%', height: 300, minHeight: 300, display: 'block' }}>
                {categoryData.length === 0 ? (
                  <div className="placeholder-box">Nenhum gasto no período</div>
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
                <div className="chart-legend" style={{ flexWrap: 'wrap' }}>
                  {categoryData.map((entry, i) => (
                    <div key={i} className="legend-item">
                      <span className="dot" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                      {entry.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="chart-card full-width-chart">
            <h3 className="chart-title" style={{ margin: '0 0 1.5rem 0' }}>Evolução Financeira Diária</h3>
            <div className="chart-content" style={{ width: '100%', height: 400, minHeight: 400, display: 'block' }}>
              {evolutionData.length === 0 ? (
                <div className="placeholder-box">Nenhuma transação encontrada para este período.</div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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