import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../../services/api';
import './TransactionModal.css';

export default function TransactionModal({ isOpen, onClose, initialType = 'entrada', onSuccess }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState(initialType);
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  
  const [loading, setLoading] = useState(false);

  // Listas de categorias separadas
  const incomeCategories = [
    "Vendas",
    "Serviços",
    "Rendimentos",
    "Outros"
  ];

  const expenseCategories = [
    "Fornecedores",
    "Aluguel",
    "Funcionários",
    "Luz/Água/Internet",
    "Marketing",
    "Impostos",
    "Manutenção",
    "Outros"
  ];

  // Atualiza o tipo quando abre o modal
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setCategory(''); // Limpa categoria ao trocar o tipo
    }
  }, [isOpen, initialType]);

  // Quando o usuário troca o select de Tipo manualmente, limpamos a categoria
  const handleTypeChange = (e) => {
    setType(e.target.value);
    setCategory('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description || !amount || !category) {
      alert("Preencha todos os campos!");
      return;
    }

    setLoading(true);

    try {
      await api.post('/transactions', {
        description,
        amount: Number(amount),
        type, // Aqui vai 'entrada' ou 'saida'
        category,
        date
      });

      setDescription('');
      setAmount('');
      setCategory('');
      
      if (onSuccess) onSuccess();
      onClose();

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar transação.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            {type === 'entrada' ? 'Nova Entrada' : 'Nova Saída'}
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Descrição</label>
            <input 
              type="text" 
              className="modal-input" 
              placeholder={type === 'entrada' ? "Ex: Venda de Produto" : "Ex: Conta de Luz"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Valor (R$)</label>
            <input 
              type="number" 
              className="modal-input" 
              placeholder="0,00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Tipo</label>
            <select 
              className="modal-input" 
              value={type} 
              onChange={handleTypeChange}
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <select 
              className="modal-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Selecione uma categoria</option>
              
              {/* Renderiza as categorias baseado no Tipo selecionado */}
              {type === 'entrada' 
                ? incomeCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))
                : expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))
              }
            </select>
          </div>

          <div className="form-group">
            <label>Data</label>
            <input 
              type="date" 
              className="modal-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            
            {/* Botão muda de cor dependendo do tipo */}
            <button 
              type="submit" 
              className={`btn-save ${type}`} // Adiciona classe 'entrada' ou 'saida'
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}