const Users = require("../models/Users");

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

exports.updatePhoto = async (req, res) => {
  try {
    const userId = req.user.id; // Получаем ID пользователя из middleware аутентификации (если используете)

    if (!req.file) {
      return res.status(400).json({ message: "Пожалуйста, загрузите файл." });
    }

    const filePath = req.file.path; // Путь к сохраненному файлу

    // Обновляем запись пользователя в базе данных
    await Users.update({ photo: filePath }, { where: { id: userId } });

    res.json({ message: "Фотография профиля успешно загружена.", filePath });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Ошибка при загрузке фотографии профиля." });
  }
};
