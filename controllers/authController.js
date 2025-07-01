const Users = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const RefreshTokens = require("../models/RefreshTokens");
const crypto = require("crypto");

exports.generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex"); // Generate a random refresh token
};

exports.generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: "10s", // Short expiration time
    }
  );
};

exports.createAndSaveRefreshToken = async (userId) => {
  const refreshToken = this.generateRefreshToken();
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  await RefreshTokens.create({
    token: hashedRefreshToken,
    userId: userId.toString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 20 * 1000), // Expires in 30 days
  });

  return refreshToken; // Return the *unhashed* refresh token
};

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await Users.create({
      username,
      email,
      password: hashedPassword,
      photo: "",
      city: "",
      phone: "",
    });
    const token = this.generateAccessToken(newUser);
    const refreshToken = await this.createAndSaveRefreshToken(newUser.id);
    res.cookie("accessToken", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    }); // 1 час
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }); // 7 дней

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      result: 0,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message, result: 1 });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Users.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(400)
        .json({ message: "Invalid credentials", result: 1 });
    }
    const token = this.generateAccessToken(user);
    const refreshToken = await this.createAndSaveRefreshToken(user.id);
    res.cookie("accessToken", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    }); // 1 час
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }); // 7 дней

    res.status(201).json({
      message: "User login successfully",
      user,
      result: 0,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies["refreshToken"];

  if (!refreshToken) {
    return res
      .status(400)
      .json({ message: "Refresh token is required", result: 1 });
  }

  try {
    // Получить все записи с хешированными токенами, чтобы сравнить
    const tokens = await RefreshTokens.findAll();

    // Найти запись, у которой хешированный токен совпадает с исходным
    const matchingTokenRecord = tokens.find(async (tokenRecord) => {
      // сравниваем хеш с оригинальным токеном
      return await bcrypt.compare(refreshToken, tokenRecord.token);
    });

    if (!matchingTokenRecord) {
      // Токен не найден или уже удален
      return res.status(200).json({
        message: "Logout successful (token already invalid)",
        result: 0,
      });
    }

    // Удаляем найденную запись
    await RefreshTokens.destroy({ where: { id: matchingTokenRecord.id } });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    // Также удаляем refresh-токен из куки, если нужно
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
    res.status(200).json({ message: "Logged out successfully", result: 0 });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      result: 1,
    });
  }
};

exports.authMe = async (req, res) => {
  try {
    if (req.user) {
      const user = await Users.findOne({ where: { id: req.user.id } });

      res.json({ user: user, result: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies["refreshToken"];

  if (!refreshToken) {
    return res
      .status(400)
      .json({ message: "Refresh token is required", result: 1 });
  }

  try {
    // Получаем все записи refresh токенов
    const refreshTokens = await RefreshTokens.findAll();

    let matchedRecord = null;

    // Перебираем записи и сравниваем
    for (const record of refreshTokens) {
      const isMatch = await bcrypt.compare(refreshToken, record.token);
      if (isMatch) {
        matchedRecord = record;
        break;
      }
    }

    if (!matchedRecord) {
      return res
        .status(403)
        .json({ message: "Invalid refresh token", result: 1 });
    }

    // Проверка истечения срока
    if (matchedRecord.expiresAt < new Date()) {
      await matchedRecord.destroy(); // Удаляем просроченный токен
      return res
        .status(403)
        .json({ message: "Refresh token has expired", result: 1 });
    }

    const user = await Users.findOne({ where: { id: matchedRecord.userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found", result: 1 });
    }

    // Создаем новые токены
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.createAndSaveRefreshToken(user.id);

    // Удаляем использованный refresh токен, чтобы предотвратить повторное использование
    await matchedRecord.destroy();

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    }); // 1 час
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }); // 7 дней

    res.json({
      message: "Tokens refreshed",
      result: 0,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: error.message, result: 1 });
  }
};
