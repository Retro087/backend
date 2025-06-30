const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const RefreshTokens = require("../models/RefreshTokens");
const crypto = require("crypto");

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex"); // Generate a random refresh token
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: "1m", // Short expiration time
    }
  );
};

const createAndSaveRefreshToken = async (userId) => {
  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  await RefreshTokens.create({
    token: hashedRefreshToken,
    userId: userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
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
    console.error("Registration error:", error);
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
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(400)
      .json({ message: "Refresh token is required", result: 1 });
  }

  try {
    // Find and delete the refresh token
    const refreshTokenRecord = await RefreshTokens.destroy({
      where: {
        token: refreshToken, // Again, compare the UNHASHED token
      },
    });

    if (refreshTokenRecord === 0) {
      // No token found/deleted
      return res.status(200).json({
        message: "Logout successful (token already invalid)",
        result: 0,
      }); // Treat as success, no error.  Token might have been revoked before.
    }

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
      const user = await User.findOne({ where: { id: req.user.id } });
      res.json({ user: user, result: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body; // Assuming refresh token is sent in the request body
  console.log(refreshToken);
  if (!refreshToken) {
    return res
      .status(400)
      .json({ message: "Refresh token is required", result: 1 });
  }

  try {
    // 1. Find the hashed refresh token in the database
    const refreshTokenRecord = await RefreshTokens.findOne({
      where: {
        token: refreshToken, // IMPORTANT:  Here, compare the UNHASHED token because you save the hashed one
      },
    });

    if (!refreshTokenRecord) {
      return res
        .status(403)
        .json({ message: "Invalid refresh token", result: 1 }); // Or 401
    }

    // 2. Validate that the refresh token has not expired
    if (refreshTokenRecord.expiresAt < new Date()) {
      // Invalidate the refresh token (optional, but recommended)
      await refreshTokenRecord.destroy(); // Delete expired refresh token from the database
      return res
        .status(403)
        .json({ message: "Refresh token has expired", result: 1 });
    }

    const userId = refreshTokenRecord.userId; // Extract the user ID from the refresh token record

    // 3. Create a new access token
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = await createAndSaveRefreshToken(userId); // Optionally rotate refresh token
    await refreshTokenRecord.destroy(); // Delete used refresh token to prevent reuse

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      result: 0,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: error.message, result: 1 });
  }
};
