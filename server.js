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
const dotenv = require("dotenv");
const cors = require("cors");
const socketIo = require("socket.io");
const http = require("http");
const { default: axios } = require("axios");
const { saveProductStats } = require("./controllers/productController");
const path = require("path");
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
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
  console.log("New client connected!");
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
        io.emit("newMessage", res.data);
      } catch (err) {
        console.log(err);
      }
    }
  );
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

connectDB();
app.use(cors());
app.use(express.json());
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
// Сохранение статистики каждый час
setInterval(saveProductStats, 3600000);
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = { io };
