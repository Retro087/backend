const Favorite = require("../models/Favorites");
const Product = require("../models/Products");
const { Op } = require("sequelize");
const ProductStats = require("../models/ProductStats");

exports.createProduct = async (req, res) => {
  const url = req.body.url;
  const userId = req.user.id;

  try {
    const newProduct = await Product.create({
      user_id: userId,
      url: url,
      name: null,
      description: null,
      short: null,
      price: null,

      photo: null,
      category: null,
      city: null,
      age: null,
      profit: null,
      margin: null,
      views: null,
      subs: null,
      status: "draft",
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { data, status } = req.body; // получаем data и status
  console.log(id, data);
  try {
    const updatedProduct = await Product.update(
      { ...data, status }, // обновляем data и status
      { where: { id } }
    );

    if (!updatedProduct[0])
      return res.status(404).json({ message: "Product not found" });

    const product = await Product.findOne({ where: { id } });

    res.json(product); // возвращаем product для redux
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Product.destroy({ where: { id } });
    if (!deletedProduct)
      return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully", id: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  let { category, userId, min, max, query } = req.query;

  try {
    const whereClause = {};
    whereClause.status = "published";
    if (category !== "all") {
      whereClause.category = category; // Добавляем условие по категории
    }

    if (query) {
      whereClause.query = {
        [Op.or]: [
          { name: { [Op.iLike]: query } },
          { description: { [Op.iLike]: query } },
        ],
      };
    }

    if (Number(min)) {
      whereClause.price = { [Op.gte]: Number(min) }; // Минимальная цена
    }
    if (Number(max)) {
      whereClause.price = { ...whereClause.price, [Op.lte]: Number(max) }; // Максимальная цена
    }

    let products = await Product.findAll({
      where: whereClause,
    });

    if (userId !== "null") {
      const favorites = await Favorite.findAll({ where: { userId: userId } });

      const favoriteIds = favorites.map((fav) => fav.itemId);
      products = products.map((product) => ({
        ...product.dataValues,
        isFavorite: favoriteIds.includes(product.id),
      }));
      return res.json(products);
    }

    if (category == "all") {
      return res.json(products);
    }

    return res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getArticle = async (req, res) => {
  try {
    let userId = req.query.userId;
    let itemId = req.params.id;

    let product = await Product.findOne({
      where: {
        id: itemId,
      },
    });

    if (userId !== "null") {
      const favorites = await Favorite.findAll({ where: { userId: userId } });
      const favoriteIds = favorites.map((fav) => fav.itemId);
      return res.json({
        ...product.dataValues,
        isFavorite: favoriteIds.includes(itemId),
      });
    }
    return res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDrafts = async (req, res) => {
  let id = req.query.userId;

  try {
    if (id) {
      let list = await Product.findAll({
        where: { status: "draft", user_id: id },
      });

      return res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStat = async (req, res) => {
  const { productId } = req.params;
  const id = req.user.id;
  console.log(productId, id);
  try {
    // Проверка прав доступа (проверяем, что продавец является владельцем товара)
    const product = await Product.findOne({
      where: { id: productId, user_id: id },
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or you do not have access" });
    }

    // Получаем статистику за последний месяц (можно изменить)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const stats = await ProductStats.findAll({
      where: {
        productId: productId,
        date: {
          [Op.gte]: lastMonth, // Больше или равно последнему месяцу
        },
      },
      order: [["date", "ASC"]], // Сортировка по дате
    });

    // Форматирование данных для графика
    const chartData = stats.map((stat) => ({
      date: stat.date,
      favorites: stat.favorites_count,
      views: stat.views_count,
    }));

    res.json({
      chartData,
      views: product.views_count,
      favorites: product.favorites_count,
    });
  } catch (error) {
    console.error("Error getting product stats:", error);
    res.status(500).json({ message: "Error getting product stats" });
  }
};

exports.addView = async (req, res) => {
  const { id } = req.params;

  try {
    // Проверка прав доступа (проверяем, что продавец является владельцем товара)
    const product = await Product.findByPk(id);

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or you do not have access" });
    }

    // Получаем статистику за последний месяц (можно изменить)

    product.views_count++;
    product.save();

    // Форматирование данных для графика

    res.json({ count: product.views_count });
  } catch (error) {
    console.error("Error getting product stats:", error);
    res.status(500).json({ message: "Error getting product stats" });
  }
};

exports.saveProductStats = async () => {
  try {
    const products = await Product.findAll({
      attributes: ["id", "favorites_count", "views_count", "user_id"],
    });

    for (const product of products) {
      await ProductStats.create({
        productId: product.id,
        sellerId: product.user_id,
        date: new Date(),
        favorites_count: product.favorites_count,
        views_count: product.views_count,
      });
    }
  } catch (error) {
    console.error("Error saving stats:", error);
  }
};

exports.getMyProducts = async (req, res) => {
  const id = req.user.id;

  try {
    // Проверка прав доступа (проверяем, что продавец является владельцем товара)
    const products = await Product.findAll({
      where: { user_id: id, status: "published" },
    });

    if (!products) {
      return res
        .status(404)
        .json({ message: "Products not found or you do not have access" });
    }

    res.json({ products });
  } catch (error) {
    console.error("Error getting product stats:", error);
    res.status(500).json({ message: "Error getting product stats" });
  }
};
