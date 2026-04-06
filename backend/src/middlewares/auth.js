const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('auth-token');
  if (!token) return res.status(401).send('Acesso negado. Faça login.');

  try {
    // O verified agora contém: { _id, role, empresa, iat }
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // Repassamos os dados do token (incluindo a empresa) para a requisição
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Token inválido');
  }
};