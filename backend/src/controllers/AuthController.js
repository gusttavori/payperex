const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const inputCode = req.body.accessCode;
    
    // 1. Mapear os códigos do .env para objetos utilizáveis
    // Certifique-se de que seu arquivo .env tenha essas variáveis definidas
    const validAccesses = [
      { code: process.env.CODE_MASTER, name: 'Visão Geral (Mestre)', role: 'master' },
      { code: process.env.CODE_UNIT_1, name: process.env.NAME_UNIT_1 || 'Unidade 1', role: 'unit' },
      { code: process.env.CODE_UNIT_2, name: process.env.NAME_UNIT_2 || 'Unidade 2', role: 'unit' },
      { code: process.env.CODE_UNIT_3, name: process.env.NAME_UNIT_3 || 'Unidade 3', role: 'unit' },
      { code: process.env.CODE_UNIT_4, name: process.env.NAME_UNIT_4 || 'Unidade 4', role: 'unit' },
    ];

    // 2. Verificar se o código digitado bate com algum do .env
    const targetAccess = validAccesses.find(access => access.code === inputCode);

    if (!targetAccess) {
      return res.status(400).send('Código de acesso inválido ou inexistente.');
    }

    // 3. Verificar se esse usuário JÁ existe no banco (buscando pelo nome único)
    let user = await User.findOne({ name: targetAccess.name });

    // 4. Se não existir, CRIA AUTOMATICAMENTE (Auto-Provisioning)
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedCode = await bcrypt.hash(inputCode, salt);
      
      user = new User({
        name: targetAccess.name,
        accessCode: hashedCode,
      });
      
      await user.save();
      console.log(`Usuário ${targetAccess.name} criado automaticamente.`);
    } else {
        // Opcional: Se o usuário já existe, poderíamos verificar se a senha bate.
        // Mas como o .env é a fonte da verdade, se o código bateu lá em cima, liberamos o acesso.
        // Isso facilita caso você mude o código no .env, o login continua funcionando.
    }

    // 5. Gerar Token incluindo a ROLE (papel) para o Front saber o que mostrar
    const token = jwt.sign({ 
      _id: user._id, 
      role: targetAccess.role // 'master' ou 'unit'
    }, process.env.JWT_SECRET);

    res.header('auth-token', token).send({ 
      token, 
      name: user.name,
      role: targetAccess.role 
    });

  } catch (err) {
    res.status(400).send("Erro no login: " + err);
  }
};

// O register fica apenas como backup ou para testes manuais se necessário
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