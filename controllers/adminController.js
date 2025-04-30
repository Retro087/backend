const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users");
const { Sequelize } = require("sequelize");
const Products = require("../models/Products");
const Payments = require("../models/Payments");

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

exports.getAllUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: { exclude: ["password"] },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Ошибка при получении списка пользователей." });
  }
};

exports.adminUpdateProfile = async (req, res) => {
  const id = req.params.id;
  const updates = req.body;

  try {
    const updatedProfile = await Users.update(updates, { where: { id } });
    if (!updatedProfile) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = await Users.findByPk(id); // Или ваша функция profile()
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminDeleteProfile = async (req, res) => {
  const id = req.params.id;

  try {
    // Попытка найти и удалить пользователя
    const deletedUser = await Users.destroy({
      where: {
        id: id,
      },
    });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(id);
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error);
    res.status(500).json({
      message: "Ошибка при удалении пользователя",
      error: error.message,
    });
  }
};

exports.adminCreateUser = async (req, res) => {
  try {
    // 1. Получите данные пользователя из тела запроса (req.body)
    const { username, email, password, role, photo, card, city, phone } =
      req.body;

    // 2. Валидация данных (ОЧЕНЬ ВАЖНО!)
    if (!username || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Все поля обязательны для заполнения." });
    }

    // Дополнительная валидация email (проверка формата)
    /*const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Неверный формат email." });
    }*/

    // Дополнительная валидация пароля (сложность, длина) - пример
    /*
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Пароль должен быть не менее 8 символов." });
    }*/

    // 3. Проверка, существует ли пользователь с таким email (или username)
    const existingUser = await Users.findOne({
      where: {
        [Sequelize.Op.or]: [{ email: email }, { username: username }], //Проверяем email И username
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Пользователь с таким email или именем уже существует.",
      }); // 409 Conflict
    }

    // 4. Хеширование пароля (ОЧЕНЬ ВАЖНО!)
    const hashedPassword = await bcrypt.hash(password, 10); // 10 - salt rounds (уровень безопасности)

    // 5. Создание пользователя в базе данных
    const newUser = await Users.create({
      username: username,
      email: email,
      password: hashedPassword, // Сохраняем хешированный пароль!
      role: role || "user", // Устанавливаем роль (user, admin и т.д.)
      photo: photo, //Передаем, если есть
      card: card, //Передаем, если есть
      city: city, //Передаем, если есть
      phone: phone, //Передаем, если есть
    });

    // 6. Отправка успешного ответа
    // Не отправляйте пароль или хеш пароля в ответе!
    const userWithoutPassword = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      photo: newUser.photo,
      card: newUser.card,
      city: newUser.city,
      phone: newUser.phone,
    };

    res.status(201).json(userWithoutPassword); // 201 Created
  } catch (error) {
    console.error("Ошибка при создании пользователя:", error);
    res.status(500).json({
      message: "Ошибка при создании пользователя.",
      error: error.message,
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Products.findAll({ where: { status: "published" } });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при получении списка продуктов." });
  }
};

exports.adminUpdateProduct = async (req, res) => {
  const { id } = req.params;
  const { data } = req.body; // получаем data и status

  try {
    const updatedProduct = await Products.update(
      { ...data }, // обновляем data и status
      { where: { id } }
    );

    if (updatedProduct[0] === 0) {
      //Проверяем, что запись действительно обновилась
      return res.status(404).json({ message: "Product not found" });
    }

    const product = await Products.findByPk(id);

    res.json(product); // возвращаем product для redux
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminDeleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Products.destroy({
      where: {
        id: id,
      },
    });

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Продукт успешно удален" });
  } catch (error) {
    console.error("Ошибка при удалении продукта:", error);
    res.status(500).json({
      message: "Ошибка при удалении продукта",
      error: error.message,
    });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const allPayments = await Payments.findAll();

    if (!allPayments.length) {
      return res.status(404).json({ message: "Нет выплат" });
    }
    res.json(allPayments);
  } catch (error) {
    console.error(error);
  }
};
