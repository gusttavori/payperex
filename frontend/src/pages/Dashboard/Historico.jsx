import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  ChevronDown, ArrowUpCircle, ArrowDownCircle, Trash2, Loader2, 
  Calendar, ChevronLeft, ChevronRight 
} from 'lucide-react';
import api from '../../services/api';
import './historico.css';

export default function Historico() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Data inicial: Mês atual
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Estados do Seletor
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorYear, setSelectorYear] = useState(new Date().getFullYear());
  const selectorRef = useRef(null);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error("Erro ao buscar histórico", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      try {
        await api.delete(`/transactions/${id}`);
        setTransactions(transactions.filter(t => t._id !== id));
      } catch (error) {
        alert("Erro ao excluir.");
      }
    }
  };

  const handleSelectMonth = (monthIndex) => {
    const monthString = String(monthIndex + 1).padStart(2, '0');
    setSelectedMonth(`${selectorYear}-${monthString}`);
    setIsSelectorOpen(false);
  };

  const handleYearChange = (increment) => {
    setSelectorYear(prev => prev + increment);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const monthlySummary = useMemo(() => {
    // Garante que não quebre se transactions for null
    if (!transactions) return { income: 0, expense: 0, balance: 0 };

    const income = filteredTransactions
      .filter(t => t.type === 'entrada')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const expense = filteredTransactions
      .filter(t => t.type === 'saida')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    return { income, expense, balance: income - expense };
  }, [filteredTransactions, transactions]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const currentMonthName = monthNames[parseInt(selectedMonth.split('-')[1]) - 1];
  const currentYearName = selectedMonth.split('-')[0];

  return (
    <div className="historico-card">
      <div className="historico-header-row">
        <h2 className="historico-title">Histórico Mensal</h2>
        
        {/* --- SELETOR PERSONALIZADO --- */}
        <div className="custom-date-selector" ref={selectorRef}>
          <button 
            className={`selector-trigger ${isSelectorOpen ? 'active' : ''}`}
            onClick={() => {
              setIsSelectorOpen(!isSelectorOpen);
              setSelectorYear(parseInt(selectedMonth.split('-')[0])); 
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <Calendar size={18} className="calendar-icon" />
              <span>{currentMonthName} de {currentYearName}</span>
            </div>
            <ChevronDown size={16} />
          </button>

          {/* DROPDOWN (MENU FLUTUANTE) */}
          {isSelectorOpen && (
            <div className="month-dropdown">
              
              {/* Cabeçalho do Ano */}
              <div className="year-header">
                <button onClick={() => handleYearChange(-1)} className="nav-arrow">
                  <ChevronLeft size={18}/>
                </button>
                <span className="year-display">{selectorYear}</span>
                <button onClick={() => handleYearChange(1)} className="nav-arrow">
                  <ChevronRight size={18}/>
                </button>
              </div>
              
              <div className="dropdown-divider"></div>

              {/* Grade de Meses */}
              <div className="months-grid">
                {monthNames.map((name, index) => {
                  // Verifica se é o mês selecionado atualmente
                  const isSelected = 
                    selectorYear === parseInt(currentYearName) && 
                    index === (parseInt(selectedMonth.split('-')[1]) - 1);
                  
                  return (
                    <button 
                      key={name} 
                      className={`month-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectMonth(index)}
                    >
                      {name.substring(0, 3)} {/* Jan, Fev, Mar... */}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ALTERAÇÃO AQUI: 
          Adicionada a condição "filteredTransactions.length > 0".
          Se não tiver transações, o resumo NÃO aparece.
      */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="monthly-summary-box">
          <div className="ms-item">
            <span>Entradas</span>
            <strong style={{color: '#22c55e'}}>{formatCurrency(monthlySummary.income)}</strong>
          </div>
          <div className="ms-divider"></div>
          <div className="ms-item">
            <span>Saídas</span>
            <strong style={{color: '#ef4444'}}>{formatCurrency(monthlySummary.expense)}</strong>
          </div>
          <div className="ms-divider"></div>
          <div className="ms-item">
            <span>Resultado</span>
            <strong style={{color: monthlySummary.balance >= 0 ? '#3b82f6' : '#ef4444'}}>
              {formatCurrency(monthlySummary.balance)}
            </strong>
          </div>
        </div>
      )}
      
      {/* Também escondemos a badge de contagem se estiver vazio,
         para ficar "apenas" a mensagem de vazio.
      */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="filters-container">
          <span className="count-badge">
            {filteredTransactions.length} transações encontradas
          </span>
        </div>
      )}

      {/* LISTA OU MENSAGEM DE VAZIO */}
      {loading ? (
        <div className="loading-container">
          <Loader2 className="animate-spin" size={32} color="#3bf683ff" />
        </div>
      ) : (
        <>
          {filteredTransactions.length === 0 ? (
            <div className="empty-state-container">
              {/* Aqui aparece apenas a mensagem quando não há dados */}
              <p className="empty-text">Nenhuma movimentação em {currentMonthName}.</p>
            </div>
          ) : (
            <div className="transactions-list">
              {filteredTransactions.map((item) => (
                <div key={item._id} className="transaction-item">
                  <div className="t-icon">
                    {item.type === 'entrada' ? (
                      <ArrowUpCircle color="#22c55e" size={24} />
                    ) : (
                      <ArrowDownCircle color="#ef4444" size={24} />
                    )}
                  </div>

                  <div className="t-info">
                    <strong>{item.description}</strong>
                    <span className="t-cat-date">
                      {item.category} • {formatDate(item.date)}
                    </span>
                  </div>

                  <div className={`t-value ${item.type}`}>
                    {item.type === 'saida' ? '- ' : '+ '}
                    {formatCurrency(item.amount)}
                  </div>

                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(item._id)}
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}