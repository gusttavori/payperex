import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, Building2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../services/api';
import logo from '../../assets/Payperex.png';
import '../Dashboard/Dashboard.css'; 
import './DashboardMaster.css'; 

export default function DashboardMaster({ onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/transactions'); 
      setTransactions(response.data);
    } catch (error) {
      console.error("Erro ao carregar dados mestre:", error);
    } finally {
      setLoading(false);
    }
  };

  const unitsData = useMemo(() => {
    const grouped = transactions.reduce((acc, curr) => {
      // Garante que existe um nome, mesmo que o objeto user seja null
      const unitName = curr.user && curr.user.name ? curr.user.name : 'Sem Unidade';
      const val = Number(curr.amount) || 0;

      if (!acc[unitName]) {
        acc[unitName] = { name: unitName, income: 0, expense: 0, balance: 0 };
      }

      if (curr.type === 'entrada') acc[unitName].income += val;
      else acc[unitName].expense += val;

      acc[unitName].balance = acc[unitName].income - acc[unitName].expense;

      return acc;
    }, {});

    return Object.values(grouped);
  }, [transactions]);

  // Debug: Abra o console do navegador (F12) para ver se isso aparece
  console.log("DADOS DO GRÁFICO:", unitsData);

  const globalTotal = unitsData.reduce((acc, curr) => acc + curr.balance, 0);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="dashboard-container master-bg">
      
      {/* --- HEADER --- */}
      <header className="geral-header">
        <div className="header-info-left">
          <span className="user-code master">ADMINISTRADOR</span>
          <p className="header-subtitle">Resumo consolidado de todas as unidades</p>
        </div>

        <img 
          src={logo} 
          alt="Logo" 
          className="geral-logo" 
        />

        <button className="logout-button" onClick={onLogout}>
          <LogOut size={16} /> 
          Sair
        </button>
      </header>

      {/* HERO CARD */}
      <div className="master-hero-card">
        <div className="hero-info">
          <span>Saldo Consolidado (Todas as Unidades)</span>
          <h1>{formatCurrency(globalTotal)}</h1>
        </div>
        <div className="hero-icon">
          <Building2 size={48} opacity={0.2} />
        </div>
      </div>

      {/* GRID DE CARDS */}
      <h3 className="section-title">Desempenho por Unidade</h3>
      <div className="units-grid">
        {unitsData.map((unit) => (
          <div key={unit.name} className="unit-card">
            <div className="unit-header">
              <Building2 size={20} color="#64748b" />
              <span>{unit.name}</span>
            </div>
            
            <div className="unit-body">
              <div className="unit-row">
                <span className="label"><TrendingUp size={14} color="#22c55e"/> Entradas</span>
                <span className="val green">{formatCurrency(unit.income)}</span>
              </div>
              <div className="unit-row">
                <span className="label"><TrendingDown size={14} color="#ef4444"/> Saídas</span>
                <span className="val red">{formatCurrency(unit.expense)}</span>
              </div>
              <div className="unit-divider"></div>
              <div className="unit-row balance">
                <span className="label"><Wallet size={14} /> Saldo</span>
                <span className={`val ${unit.balance >= 0 ? 'blue' : 'red'}`}>
                  {formatCurrency(unit.balance)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- GRÁFICO COMPARATIVO (CORRIGIDO) --- */}
      <h3 className="section-title" style={{marginTop: 32}}>Comparativo de Saldos</h3>
      
      <div className="chart-card full-width-chart">
        {/* 1. FORÇA BRUTA: Estilo Inline na DIV pai */}
        <div className="chart-content" style={{ width: '100%', height: 400, minHeight: 400, display: 'block' }}>
          
          {unitsData.length > 0 ? (
            // 2. FORÇA BRUTA: Altura fixa no componente
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={unitsData} 
                layout="vertical" 
                margin={{ left: 40, right: 20, top: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120} 
                  style={{fontSize: 12, fontWeight: 600, fill: '#475569'}} 
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)} 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="balance" radius={[0, 4, 4, 0]} barSize={32}>
                  {unitsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.balance >= 0 ? '#3b82f6' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#94a3b8'
            }}>
              Nenhum dado para exibir no gráfico
            </div>
          )}
        </div>
      </div>

    </div>
  );
}