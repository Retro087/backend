const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const RefreshTokens = require("../models/RefreshTokens");
const crypto = require("crypto");
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex"); // Generate a random refresh token
};

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1h", // Короткий срок действия
  });
};

const createAndSaveRefreshToken = async (userId) => {
  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  await RefreshTokens.create({
    token: hashedRefreshToken,
    userId: userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return refreshToken; // Return the *unhashed* refresh token
};

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      photo: "",
      city: "",
      phone: "",
    });
    const token = generateAccessToken(newUser);
    const refreshToken = await createAndSaveRefreshToken(newUser.id);

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token,
      refreshToken: refreshToken,
      result: 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message, result: 1 });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ message: "Invalid credentials", result: 1 });
    }
    const token = generateAccessToken(user);
    const refreshToken = await createAndSaveRefreshToken(user.id);

    res.json({ token, user, result: 0, refreshToken: refreshToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ message: "Invalid credentials", result: 1 });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token, user, result: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.authMe = async (req, res) => {
  try {
    if (req.user) {
      const user = await User.findOne({ where: { id: req.user.id } });
      res.json({ user: user, result: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    // Find the refresh token record by *user_id*
    const refreshTokenRecord = await RefreshTokens.findOne({
      where: { userId: req.user.userId },
      order: [["createdAt", "DESC"]],
    });

    if (!refreshTokenRecord) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Compare the *hashed* token from the database with the hash of the received token
    const isTokenValid = await bcrypt.compare(
      refreshToken,
      refreshTokenRecord.token
    );

    if (!isTokenValid) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = generateAccessToken(refreshTokenRecord.user);
    const newRefreshToken = generateRefreshToken();
    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    // Update the refresh token in the database
    refreshTokenRecord.token = hashedNewRefreshToken;
    refreshTokenRecord.expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );
    await refreshTokenRecord.save();

    res.json({ accessToken, refreshToken: newRefreshToken }); // Send new unhashed token
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to refresh token" });
  }
};
