const Subscription = require("../models/Subscription");
const UserSubscription = require("../models/UserSubscription");

const checkSubscription = async (req, res, next) => {
  const userId = req.UserSubscription.userId;
  try {
    // Получаем подписку пользователя
    const subscription = await Subscription.findOne({
      where: { userId: userId },
    });

    // Проверяем, есть ли подписка и какого вида
    if (!subscription) {
      return res.status(403).json({ message: "У вас нет активной подписки." });
    }

    // Проверка типа подписки
    if (subscription.type !== "premium") {
      return res
        .status(403)
        .json({
          message: "Вам нужна премиум подписка для выставления объявления.",
        });
    }

    // Если все проверки пройдены, продолжаем
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера." });
  }
};

module.exports = checkSubscription;
