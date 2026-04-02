const router = require('express').Router();
// Importações
const verify = require('../middlewares/auth');
const TransactionController = require('../controllers/TransactionController');

// --- ÁREA DE DIAGNÓSTICO ---
console.log("--- DEBUG ROUTER ---");
console.log("Middleware Verify é função?", typeof verify === 'function');
console.log("Controller List é função?", typeof TransactionController.list === 'function');
console.log("--------------------");
// ---------------------------

// Se o middleware não for função, o erro acontece aqui
if (typeof verify !== 'function') {
    throw new Error('ERRO FATAL: O arquivo middlewares/auth.js não está exportando uma função corretamente.');
}

router.get('/', verify, TransactionController.list);
router.post('/', verify, TransactionController.create);
router.delete('/:id', verify, TransactionController.remove);

module.exports = router;