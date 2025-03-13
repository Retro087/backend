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

exports.addCategory = async (req, res) => {
  try {
    let category = req.body.category;
    if (!category) {
      res.status(404).json({ message: "Вы должны указать категорию" });
    }
    let newCategory = await Categories.create({ Category: category });
    res.status(200).json({ message: "Вы успешно добавили категорию" });
  } catch (error) {
    console.log(error);
  }
};
