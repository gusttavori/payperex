const Transaction = require('../models/Transaction');

// LISTAR
const list = async (req, res) => {
  try {
    // O middleware 'auth.js' já colocou as infos do usuário em req.user

    if (req.user.role === 'master') {
      // === CENÁRIO MESTRE ===
      // Traz TODAS as transações de TODAS as unidades
      // O .populate troca o ID do usuário pelo objeto com o Nome, para sabermos de quem é a conta
      const transactions = await Transaction.find()
        .populate('user', 'name') 
        .sort({ date: -1 });
        
      return res.json(transactions);

    } else {
      // === CENÁRIO UNIDADE ===
      // Traz apenas as transações DESTA unidade (req.user._id)
      const transactions = await Transaction.find({ user: req.user._id })
        .sort({ date: -1 });
        
      return res.json(transactions);
    }

  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar transações", error: err });
  }
};

// CRIAR
const create = async (req, res) => {
  // Bloqueio: Mestre não deve lançar contas (para não sujar o relatório sem dono)
  if (req.user.role === 'master') {
    return res.status(403).json({ message: "O perfil Mestre apenas visualiza os dados. Entre com o código de uma unidade para lançar." });
  }

  try {
    const transaction = new Transaction({
      user: req.user._id, // Pega o ID da unidade logada
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
    let query = { _id: req.params.id };

    // Segurança: Se NÃO for mestre, só pode deletar se a transação for DELE
    if (req.user.role !== 'master') {
      query.user = req.user._id;
    }
    // Se for mestre, ele deleta qualquer uma (pois a query só tem o ID da transação)

    const removedTransaction = await Transaction.deleteOne(query);

    if (removedTransaction.deletedCount === 0) {
        return res.status(404).json({ message: "Transação não encontrada ou você não tem permissão para excluí-la." });
    }

    res.json(removedTransaction);
  } catch (err) {
    res.status(400).json({ message: "Erro ao deletar", error: err });
  }
};

// EXPORTAÇÃO PADRÃO
module.exports = {
  list,
  create,
  remove
};