const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Users = require("../models/Users");
const { where } = require("sequelize");

async function profile(id) {
  const profile = await Users.findOne({
    where: { id },
  });

  if (!profile) {
    return null;
  }
  const response = {
    id: profile.id,
    photo: profile.photo,
    personal: {
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
      card: profile.card,
    },
  };
  return response;
}

exports.updateProfile = async (req, res) => {
  const id = req.user.id;
  const updates = req.body;

  try {
    const updatedProfile = await Users.update(updates, { where: { id } });
    const user = await profile(id);
    if (!updatedProfile) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      message: "Product updated successfully",
      profile: user,
      result: 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  const id = req.user.id;
  try {
    const user = await profile(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ profile: { ...user }, result: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/"; // Папка для сохранения загруженных файлов
    // Проверяем, существует ли папка, и создаем ее, если нет
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir); // Указываем папку для сохранения
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9); // Уникальный суффикс для имени файла
    const ext = path.extname(file.originalname); // Получаем расширение файла
    cb(null, `profile-${uniqueSuffix}${ext}`); // Формируем имя файла
  },
});

const upload = multer({ storage: storage });

exports.updatePicture = async (req, res) => {
  const userId = req.params.id; // Получаем ID пользователя из тела запроса
  const filePath = req.file;
  console.log(userId, filePath); // Получаем путь к загруженному файлу
  try {
    if (!userId || !filePath) {
      return res.status(404).json({ message: "Не найдено" });
    }
    const profilePictureUrl = `http://localhost:5000/uploads/${filePath.filename}`;
    const user = await Users.update(
      { photo: profilePictureUrl }, //  Значения для обновления
      {
        where: { id: userId }, //  Условие WHERE
      }
    );

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден." });
    }

    res.status(200).json({
      message: "Фото профиля успешно обновлено!",
      photo: profilePictureUrl,
      id: userId,
    });
  } catch (error) {
    console.log(error);
  }
};
