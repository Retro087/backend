const Favorite = require("../models/Favorites");
const Product = require("../models/Products");
const ProductStats = require("../models/ProductStats");

exports.getFavorite = async (req, res) => {
  const id = req.user.id;

  try {
    const favorite = await Favorite.findAll({
      where: { userId: id },
      include: {
        model: Product,
        as: "Product", // Укажите alias для связи
      },
    });

    const items = favorite.map((i) => {
      if (i.Product) {
        return {
          ...i.Product.dataValues,
          isFavorite: true,
        };
      } else {
        console.warn(`Product not found for favorite ID: ${i.id}`);
        return null;
      }
    });

    const filteredItems = items.filter((item) => item !== null);

    return res.json(filteredItems);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
exports.createFavorite = async (req, res) => {
  const { id } = req.params;

  const userId = req.user.id;
  console.log(id, userId);
  if (!userId || !id) {
    return res.status(400).json({ error: "Item not found" });
  }
  try {
    const itemsExist = await Product.findByPk(id);
    if (!itemsExist) {
      return res.status(400).json({ error: "Item not found" });
    }
    const existingFavorite = await Favorite.findOne({
      where: { userId, itemId: id },
    });

    if (existingFavorite) {
      return res.status(400).json({ error: "Item is already in favorites" });
    }

    const newFavorite = await Favorite.create({
      userId: userId,
      itemId: id,
    });

    itemsExist.favorites_count++;
    itemsExist.save();
    res.status(201).json({
      newFavorite: { ...newFavorite.dataValues, isFavorite: true },
      result: 0,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFavorite = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id);
    const deletedProduct = await Favorite.destroy({ where: { itemId: id } });
    if (!deletedProduct)
      return res.status(404).json({ message: "Favorite not found" });
    product.favorites_count -= 1;
    product.save();
    res.json({ message: "Product deleted successfully", result: 0, id: id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message, result: 1 });
  }
};
