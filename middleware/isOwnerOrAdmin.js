exports.isOwnerOrAdmin = (req, res, next) => {
  const userIdFromParams = req.params.id; // ID пользователя из параметров URL
  const loggedInUserId = req.user.id; // ID вошедшего пользователя (из middleware аутентификации)
  const userRole = req.user.role; //Роль вошедшего пользователя

  if (loggedInUserId === userIdFromParams || userRole === "admin") {
    next(); // Пользователь - владелец профиля ИЛИ администратор, продолжаем выполнение
  } else {
    res.status(403).json({
      message:
        "Доступ запрещен. Требуется быть владельцем профиля или администратором.",
    });
  }
};
