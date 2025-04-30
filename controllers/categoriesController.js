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
    res
      .status(200)
      .json({ message: "Вы успешно добавили категорию", newCategory });
  } catch (error) {
    console.log(error);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    if (!id) {
      return res.status(404).json({ message: "Вы должны указать id" });
    }
    const deletedCategory = await Categories.destroy({
      where: { id: id },
    });
    if (!deletedCategory) {
      return res.status(404).json({ message: "Нет категории" });
    }

    res.status(200).json({
      message: "Вы успешно удалили категорию",
      deletedCategory: id,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const id = req.body.id;
    const updateData = req.body.updateData;
    console.log(id, updateData);
    if (!id || !updateData) {
      return res
        .status(404)
        .json({ message: "Вы должны указать все свойства" });
    }
    const updatedCategory = await Categories.update(
      { ...updateData },
      {
        where: { id: id },
      }
    );
    console.log(updatedCategory);
    if (!updatedCategory) {
      return res.status(404).json({ message: "Нет категории" });
    }
    return res.json(updatedCategory);
  } catch (error) {
    console.log(error);
  }
};
