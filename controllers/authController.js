const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token,
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

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token, user, result: 0 });
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
