const Expenses = require("../models/Expenses");
const Products = require("../models/Products");
const SocialMedia = require("../models/SocialMedia");

// 1. Создание расхода (POST /expenses/:id)
exports.createSocialMedia = async (req, res) => {
  // Предполагается, что в теле запроса приходит объект expense
  const { social } = req.body;
  const businessId = req.params.id;
  console.log(social, businessId);
  if (!social || typeof social !== "object") {
    return res
      .status(400)
      .json({ message: "Должен быть передан объект social" });
  }

  const { platform, followers } = social;

  // if (!title || amount === undefined || amount === null) {
  //   return res.status(400).json({ message: "Поля title и amount обязательны" });
  // }

  try {
    // Проверка существования бизнеса
    const business = await Products.findByPk(businessId);

    if (!business) {
      return res.status(404).json({ message: "Бизнес не найден" });
    }

    const newsocial = await SocialMedia.create({
      businessId,
      platform,
      followers,
    });

    res.status(201).json({
      message: "Расход успешно создан",
      social: newsocial,
    });
  } catch (error) {
    console.error("Ошибка при создании расхода:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
// 2. Получение всех расходов (GET /values)
exports.getAllSocials = async (req, res) => {
  try {
    const socials = await SocialMedia.findAll({
      where: { businessId: req.params.id },
      // Сортировка по дате убыванию
    });

    res.status(200).json(socials);
  } catch (error) {
    console.error("Ошибка при получении соц.сетей:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 3. Получение расхода по ID (GET /expenses/:id)
exports.getSocialById = async (req, res) => {
  const { id } = req.params; // Получаем ID из параметров запроса

  try {
    const social = await SocialMedia.findByPk(id, {
      include: [
        { model: Business, as: "business" },
        { model: ExpenseCategory, as: "category" },
      ],
    });

    if (!social) {
      return res.status(404).json({ message: "Расход не найден" });
    }

    res.status(200).json(social);
  } catch (error) {
    console.error("Ошибка при получении расхода по ID:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 4. Обновление расхода (PUT /expenses/:id)
exports.updateSocial = async (req, res) => {
  const socialData = req.body.social; // предполагается, что весь объект expense передается
  console.log(socialData);
  try {
    // Проверка существования расхода
    const social = await SocialMedia.findByPk(socialData.id);
    if (!social) {
      return res.status(404).json({ message: "Расход не найден" });
    }

    // Обновляем все поля, переданные в socialData
    Object.assign(social, socialData);

    await social.save(); // Сохраняем изменения

    res.status(200).json({ message: "Расход успешно обновлен", social });
  } catch (error) {
    console.error("Ошибка при обновлении расхода:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
// 5. Удаление расхода (DELETE /socials/:id)
exports.deleteSocial = async (req, res) => {
  const { id } = req.params;

  try {
    const social = await SocialMedia.findByPk(id);

    if (!social) {
      return res.status(404).json({ message: "Расход не найден" });
    }

    await social.destroy(); // Удаляем запись

    res.status(200).json({ message: "Расход успешно удален", id });
  } catch (error) {
    console.error("Ошибка при удалении расхода:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
