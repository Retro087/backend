const jwt = require("jsonwebtoken");
const User = require("../models/Users"); // Путь к вашей модели User

exports.authenticateToken = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  // Проверка наличия токена
  if (!token) {
    return res.status(401).json({ message: "Отсутствует токен." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Декодируем JWT

    // Получаем пользователя из базы данных по ID, который находится в JWT
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден." });
    }

    req.user = user; // Передача объекта пользователя дальше по middleware

    next();
  } catch (err) {
    console.error("Ошибка при аутентификации:", err);
    return res.status(401).json({ message: "Недействительный токен." });
  }
};
exports.authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.sendStatus(403); // Forbidden
    }
    next();
  };
};
