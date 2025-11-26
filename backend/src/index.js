const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoute = require('./routes/auth');
const transactionRoute = require('./routes/transactions'); // <--- O erro estava aqui

dotenv.config();
const app = express();

// Conexão MongoDB
mongoose.connect(process.env.DB_CONNECT)
  .then(() => console.log('Conectado ao MongoDB!'))
  .catch(err => console.log('Erro DB:', err));

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/user', authRoute);
app.use('/api/transactions', transactionRoute); // <--- Agora deve funcionar

app.listen(3000, () => console.log('Servidor rodando na porta 3000! 🚀'));