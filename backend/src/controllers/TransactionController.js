const Transaction = require('../models/Transaction');

// LISTAR
const list = async (req, res) => {
  try {
    // A SEGURANÇA COMEÇA AQUI: Criamos um filtro base que SEMPRE inclui a empresa
    // Isso impede que a Empresa A veja dados da Empresa B, mesmo sendo Master.
    let filtro = { empresa: req.user.empresa };

    if (req.user.role === 'master') {
      // === CENÁRIO MESTRE ===
      // Já temos o filtro por empresa, então ele verá todas as unidades DAQUELA empresa.
      const transactions = await Transaction.find(filtro)
        .populate('user', 'name')
        .sort({ date: -1 });

      return res.json(transactions);

    } else {
      // === CENÁRIO UNIDADE ===
      // Além da empresa, filtramos pelo ID específico da unidade (usuário)
      filtro.user = req.user._id;

      const transactions = await Transaction.find(filtro)
        .sort({ date: -1 });

      return res.json(transactions);
    }

  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar transações", error: err });
  }
};

// CRIAR
const create = async (req, res) => {
  if (req.user.role === 'master') {
    return res.status(403).json({ message: "O perfil Mestre apenas visualiza os dados." });
  }

  try {
    const transaction = new Transaction({
      empresa: req.user.empresa, // CARIMBO CRÍTICO: Vincula a transação à empresa do usuário
      user: req.user._id,
      description: req.body.description,
      amount: req.body.amount,
      type: req.body.type,
      category: req.body.category,
      date: req.body.date || Date.now()
    });

    const savedTransaction = await transaction.save();
    res.json(savedTransaction);
  } catch (err) {
    res.status(400).json({ message: "Erro ao salvar", error: err });
  }
};

// DELETAR
const remove = async (req, res) => {
  try {
    // SEGURANÇA MÁXIMA: A query de deleção OBRIGATORIAMENTE checa a empresa.
    // Isso impede que alguém manipule o ID na URL para deletar algo de outra empresa.
    let query = {
      _id: req.params.id,
      empresa: req.user.empresa
    };

    if (req.user.role !== 'master') {
      query.user = req.user._id;
    }

    const removedTransaction = await Transaction.deleteOne(query);

    if (removedTransaction.deletedCount === 0) {
      return res.status(404).json({ message: "Transação não encontrada ou permissão negada." });
    }

    res.json(removedTransaction);
  } catch (err) {
    res.status(400).json({ message: "Erro ao deletar", error: err });
  }
};

module.exports = { list, create, remove };