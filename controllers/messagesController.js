const { sequelize } = require("../config/db");
const Chats = require("../models/Chats");
const Messages = require("../models/Messages");
const Message = require("../models/Messages");
const { Op } = require("sequelize");
exports.getMessages = async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user.id; // ID пользователя, который просматривает сообщения

  try {
    // 1. Получаем сообщения для чата
    const messages = await Message.findAll({
      where: { chatId },
      order: [["createdAt", "ASC"]],
    });

    // 2. Обновляем isRead для сообщений, отправленных другим пользователем
    await Message.update(
      { isRead: true },
      {
        where: {
          chatId: chatId,
          recieverId: userId, // Сообщения, полученные текущим пользователем
          isRead: false, // Только непрочитанные сообщения
        },
      }
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.createMessage = async (req, res) => {
  const { senderId, recieverId, content, chatId } = req.body;
  console.log(senderId, recieverId, content, chatId)
  try {
    // 1. Проверяем существование чата между пользователями
    let chat = await Chats.findOne({
      where: {
        id: chatId,
      },
    });

    // 2. Если чата нет, создаем его
    if (!chat) {
      chat = await Chats.create({
        user1: senderId,
        user2: recieverId,
      });
    }

    // 3. Создаем сообщение
    const message = await Message.create({
      senderId,
      recieverId,
      chatId: chat.id, // Предполагается, что у вас есть поле chatId в модели Messages
      isRead: false,
      content,
    });

    // 4. Обновляем чат, добавляя id последнего сообщения
    await Chats.update(
      { lastMessage: message.id },
      {
        where: { id: chat.id },
      }
    );

    // Получаем обновленный чат с последним сообщением
    const updatedChat = await Chats.findByPk(chat.id);

    // 6. Получаем последнее сообщение (отдельным запросом)
    const lastMessage = updatedChat.lastMessage
      ? await Messages.findByPk(updatedChat.lastMessage)
      : null;

    res
      .status(200)
      .json({ message, chat: updatedChat, lastMessage, result: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
exports.getUnreadCounts = async (req, res) => {
  const userId = req.user.id;

  try {
    const chats = await Chats.findAll({
      attributes: ["id"],
      where: {
        [Op.or]: [{ user1: userId }, { user2: userId }],
      },
      raw: true,
    });

    console.log("Chats:", chats); // <--- Добавлено логирование

    const chatIds = (chats || []).map((chat) => chat.id);

    const totalUnreadCount = await Message.count({
      where: {
        chatId: {
          [Op.in]: chatIds,
        },
        isRead: false,
        senderId: { [Op.ne]: userId },
      },
    });

    res.json(totalUnreadCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
