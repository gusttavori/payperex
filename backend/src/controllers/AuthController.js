const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const inputCode = req.body.accessCode;

    // IDs das empresas gerados no MongoDB
    const ID_REDENCAO = "69d3b7eae5db855ec7fea06c"; // Exemplo: 69d3b7eae5db855ec7fea06c
    const ID_OFICINA = "69d3bdede5db855ec7fea06d";

    // 1. Mapear os códigos do .env para objetos utilizáveis e VINCULAR AS EMPRESAS
    const validAccesses = [
      // === IGREJA REDENÇÃO ===
      { code: process.env.CODE_MASTER, name: 'Visão Geral (Mestre)', role: 'master', empresaId: ID_REDENCAO },
      { code: process.env.CODE_UNIT_1, name: process.env.NAME_UNIT_1 || 'Unidade 1', role: 'unit', empresaId: ID_REDENCAO },
      { code: process.env.CODE_UNIT_2, name: process.env.NAME_UNIT_2 || 'Unidade 2', role: 'unit', empresaId: ID_REDENCAO },
      { code: process.env.CODE_UNIT_3, name: process.env.NAME_UNIT_3 || 'Unidade 3', role: 'unit', empresaId: ID_REDENCAO },
      { code: process.env.CODE_UNIT_4, name: process.env.NAME_UNIT_4 || 'Unidade 4', role: 'unit', empresaId: ID_REDENCAO },
      { code: process.env.CODE_UNIT_5, name: process.env.NAME_UNIT_5 || 'Unidade 5', role: 'unit', empresaId: ID_REDENCAO },

      // === NOVA EMPRESA (CLIENTE 2) ===
      { code: process.env.CODE_MASTER_EMP2, name: 'Visão Geral - Oficina', role: 'master', empresaId: ID_OFICINA },
      { code: process.env.CODE_UNIT_1_EMP2, name: process.env.NAME_UNIT_1_EMP2 || 'Oficina', role: 'unit', empresaId: ID_OFICINA },
    ];

    // 2. Verificar se o código digitado bate com algum do .env
    const targetAccess = validAccesses.find(access => access.code === inputCode);

    if (!targetAccess) {
      return res.status(400).send('Código de acesso inválido ou inexistente.');
    }

    // 3. Verificar se esse usuário JÁ existe no banco (buscando pelo nome único)
    let user = await User.findOne({ name: targetAccess.name });

    // 4. Se não existir, CRIA AUTOMATICAMENTE já com a empresa certa!
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedCode = await bcrypt.hash(inputCode, salt);

      user = new User({
        name: targetAccess.name,
        accessCode: hashedCode,
        empresa: targetAccess.empresaId // <--- O CARIMBO AUTOMÁTICO AQUI
      });

      await user.save();
      console.log(`Usuário ${targetAccess.name} criado automaticamente na empresa ${targetAccess.empresaId}.`);
    }

    // 5. Gerar Token incluindo a ROLE e a EMPRESA para o Front saber o que mostrar
    // É AQUI QUE O ISOLAMENTO DE DADOS NASCE:
    const token = jwt.sign({
      _id: user._id,
      role: targetAccess.role, // 'master' ou 'unit'
      empresa: user.empresa    // <--- INJETAMOS A EMPRESA NO CRACHÁ DO USUÁRIO
    }, process.env.JWT_SECRET);

    res.header('auth-token', token).send({
      token,
      name: user.name,
      role: targetAccess.role,
      empresa: user.empresa // Enviamos para o React caso você precise usar na UI
    });

  } catch (err) {
    res.status(400).send("Erro no login: " + err);
  }
};

const register = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(req.body.accessCode, salt);

    const user = new User({
      name: req.body.name,
      accessCode: hashedCode
    });

    const savedUser = await user.save();
    res.send({ user: savedUser._id });
  } catch (err) {
    res.status(400).send(err);
  }
};

module.exports = { login, register };