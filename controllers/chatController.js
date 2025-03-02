const Messages = require("../models/Messages");
const { Op } = require("sequelize");
const Users = require("../models/Users");
const Chats = require("../models/Chats");

exports.getChats = async (req, res) => {
  const userId = req.user.id;

  try {
    const chats = await Chats.findAll({
      where: {
        [Op.or]: [{ user1: userId }, { user2: userId }],
      },
      // Сортируем чаты по дате создания последнего сообщения
    });

    // Форматируем результат
    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.user1 === userId ? chat.user2 : chat.user1;
        const lastMessage = chat.lastMessage
          ? await Messages.findByPk(chat.lastMessage)
          : null;
        const otherUser = await Users.findByPk(otherUserId);

        if (!otherUser) {
          console.warn(`Пользователь с ID ${otherUserId} не найден`);
          return null; // Пропускаем этот чат, если не найден пользователь
        }

        // Получаем количество непрочитанных сообщений в чате
        const unreadCount = await Messages.count({
          where: {
            chatId: chat.id,
            isRead: false,
            senderId: { [Op.ne]: userId }, // Сообщения, отправленные другим пользователем
          },
        });

        return {
          chatId: chat.id,
          photo: otherUser.photo,
          username: otherUser.username,
          lastMessage: lastMessage ? lastMessage.content : "",
          createdAt: lastMessage ? lastMessage.createdAt : null,
          unreadCount: unreadCount, // Добавляем количество непрочитанных сообщений
        };
      })
    );

    // Отфильтровываем null значения, если такие есть
    const filteredChats = formattedChats.filter((chat) => chat !== null);

    res.json(filteredChats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.createChat = async (req, res) => {
  const { user1, user2 } = req.body;
  console.log(user1, user2);
  try {
    // Проверяем существование чата между пользователями
    if (user1 === user2) {
      return res.status(400).json({
        message: "Вы не можете отправить сообщение себе",
        result: 1,
      });
    }

    const existingChat = await Chats.findOne({
      where: {
        [Op.or]: [
          { user1: user1, user2: user2 },
          { user1: user2, user2: user1 },
        ],
      },
    });

    if (existingChat) {
      return res.status(200).json({
        message: "Чат между этими пользователями уже существует",
        chat: existingChat,
        result: 0,
      });
    }

    // Создаем чат
    const chat = await Chats.create({
      user1,
      user2,
    });

    res.status(201).json({ chat, selected: chat.id, result: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
