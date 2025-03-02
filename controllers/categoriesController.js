const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Categories = require("../models/Categories");

exports.getCategory = async (req, res) => {
  try {
    const categories = await Categories.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
