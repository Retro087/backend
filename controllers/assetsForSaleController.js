const AssetForSale = require("../models/AssetsForSale");

// Обработчик для сохранения или обновления данных
exports.saveAssetForSale = async (req, res) => {
  const {
    businessId,
    selectedItems,
    isUniqueContent,
    isUniqueDesign,
    support,
  } = req.body;
  console.log(businessId, selectedItems, isUniqueContent, isUniqueDesign);
  try {
    // Используем upsert для вставки или обновления
    const [record, created] = await AssetForSale.upsert(
      {
        businessId,
        selectedItems,
        isUniqueContent,
        isUniqueDesign,
        support,
      },
      { returning: true }
    );
    res.json({ message: "Данные успешно сохранены", data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

// Обработчик для получения данных по businessId
exports.getAssetForSale = async (req, res) => {
  const { businessId } = req.params;
  console.log(businessId);
  try {
    const record = await AssetForSale.findOne({ where: { businessId } });
    if (!record) {
      return res.status(404).json({ error: "Данные не найдены" });
    }
    console.log(record);
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};
