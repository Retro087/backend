const express = require("express");
const { connectDB, sequelize } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoriesRoutes = require("./routes/categoriesRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const messagesRoutes = require("./routes/messagesRoutes");
const chatRoutes = require("./routes/chatRoutes");
const profileRoutes = require("./routes/profileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const purchaseRequestRoutes = require("./routes/purchaseRequestsRoutes");
const assetTransfersRoutes = require("./routes/assetTransferRoutes");
const transactionsRoutes = require("./routes/transactionRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const expensesRoutes = require("./routes/expensesRoutes");

const dotenv = require("dotenv");
const cors = require("cors");
const socketIo = require("socket.io");
const http = require("http");
const { default: axios } = require("axios");
const { saveProductStats } = require("./controllers/productController");
const path = require("path");
const Messages = require("./models/Messages");
const passport = require("passport");
const Users = require("./models/Users");
const {
  generateAccessToken,
  createAndSaveRefreshToken,
} = require("./controllers/authController");
const bcrypt = require("bcryptjs/dist/bcrypt");
const cookieParser = require("cookie-parser");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
dotenv.config();

const syncDatabase = async () => {
  try {
    await sequelize.sync(); // Синхронизация моделей с базой данных
    console.log("Database synced");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
};

syncDatabase();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
  console.log("New client connected!");
  // Получаем userId

  socket.on(
    "sendMessage",
    async ({ senderId, recieverId, chatId, content, token }) => {
      try {
        const res = await axios.post(
          `http://localhost:${PORT}/api/chats/createMessage`,
          {
            senderId,
            recieverId,
            chatId,
            content,
          }
        );
        io.to(chatId).emit("newMessage", res.data);
      } catch (err) {
        console.log(err);
        socket.emit("messageError", {
          message: "Failed to send message",
          error: err.message,
        });
      }
    }
  );
  socket.on("mark_as_read", async (data) => {
    try {
      const { messageId, userId, chatId } = data;

      //  Обновляем поле readAt в базе данных
      await Messages.update(
        { isRead: true },
        {
          where: {
            id: messageId,
            recieverId: userId, //  Только для получателя
            chatId: chatId,
            isRead: false, //  Убедимся, что сообщение еще не прочитано
          },
        }
      );

      //  Отправляем событие об изменении статуса прочтения в комнату
      io.to(chatId).emit("message_read", { messageId, userId, chatId }); // Отправляем userId для проверки
    } catch (error) {
      console.error("Error marking message as read:", error);
      socket.emit("readError", {
        message: "Failed to mark message as read",
        error: error.message,
      });
    }
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
  socket.on("join_room", async (data) => {
    socket.join(data.id);
  });
});
app.use((req, res, next) => {
  req.io = io; // Добавляем io в объект request
  next();
});

connectDB();
app.use(
  cors({
    origin: "http://localhost:3000", // укажите ваш фронтенд-адрес
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/favorite", favoriteRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/purchase-requests", purchaseRequestRoutes);
app.use("/api/asset-transfers", assetTransfersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/expenses", expensesRoutes);

app.use(
  require("express-session")({
    secret: "your_secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Настройка стратегии
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.Client_id,
      clientSecret: process.env.Client_secret,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        // Попытка найти пользователя по profile.id или email
        let user = await Users.findOne({ where: { google_id: profile.id } });

        if (!user) {
          // Если пользователя нет — создаем нового
          const hashedPassword = await bcrypt.hash(profile.displayName, 10);

          // Можно сгенерировать случайный пароль или оставить поле пустым, если оно не обязательно
          user = await Users.create({
            username: profile.displayName || profile.emails[0].value, // например, имя из профиля
            email: profile.emails[0].value,
            password: hashedPassword, // если в вашей модели есть пароль, иначе оставьте пустым
            google_id: profile.id, // сохраняем id для последующих входов
            photo: profile.photos ? profile.photos[0].value : "",
            city: "", // по желанию
            phone: "", // по желанию
          });
        }
        const token = generateAccessToken({
          id: user.id,
          username: user.username,
          email: user.email,
        });
        const refreshToken = await createAndSaveRefreshToken(user.id);
        // Возвращаем пользователя
        return done(null, { user, token, refreshToken });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Маршрут для начала авторизации
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback URL после авторизации
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const { user, token, refreshToken } = req.user; // или из аргумента, если так передали

    // Можно отправить JSON с токенами
    res.cookie("accessToken", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    }); // 1 час
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    }); // 7 дней

    // Перенаправление на страницу клиента
    res.redirect("http://localhost:3000/");
  }
);

// Сохранение статистики каждый час
setInterval(saveProductStats, 3600000);
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = { io };
