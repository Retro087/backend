const Notifications = require("../models/Notifications");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notifications.findAll({
      where: { userId: userId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при получении уведомлений" });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notifications.findByPk(id);
    if (!notification) {
      return res.status(404).json({ message: "Уведомление не найдено" });
    }

    if (notification.userId !== userId) {
      return res
        .status(403)
        .json({ message: "У вас нет прав на изменение этого уведомления" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      message: "Уведомление отмечено как прочитанное",
      id: notification.id,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Ошибка при отметке уведомления как прочитанного" });
  }
};
