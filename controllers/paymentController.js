const { authenticateToken } = require("../middleware/authMiddleware");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Products = require("../models/Products");
const Payments = require("../models/Payments");
const AssetTransfer = require("../models/AssetTransfer");
const Payouts = require("../models/Payouts");
const Users = require("../models/Users");
const PurchaseRequests = require("../models/PurchaseRequests");
const Notifications = require("../models/Notifications");
const crypto = require("crypto");

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;

const generateAuthHeader = () => {
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  return `Basic ${auth}`;
};
const trustedYookassaIPs = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11",
  "77.75.156.35",
  "77.75.154.128/25",
  "2a02:5180::/32",
];

function isIPInSubnet(ip, subnet) {
  try {
    if (subnet.includes(":")) {
      // IPv6
      const [address, prefix] = subnet.split("/");
      const parsedIP = ipaddr.parse(ip);
      const parsedSubnet = ipaddr.parse(address);
      return (
        parsedIP.kind() === "ipv6" &&
        parsedIP.match(parsedSubnet, parseInt(prefix))
      );
    } else {
      // IPv4
      return (
        ipaddr.isValid(ip) &&
        ipaddr.IPv4.networkAddress(ipaddr.parse(ip), subnet).toString() === ip
      );
    }
  } catch (e) {
    console.error("Ошибка при проверке IP:", e);
    return false;
  }
}

//  Функция для проверки, является ли IP-адрес доверенным
function isTrustedYookassaIP(ip) {
  for (const subnet of trustedYookassaIPs) {
    if (isIPInSubnet(ip, subnet)) {
      return true;
    }
  }
  return false;
}

function verifyYookassaSignature(signature, body, secretKey) {
  try {
    const utf8Body = JSON.stringify(body); // Тело запроса в виде JSON-строки (UTF-8)

    // Создаем HMAC с использованием SHA-256
    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(utf8Body)
      .digest("hex"); // Получаем хеш в шестнадцатеричном формате

    // Сравниваем вычисленный хеш с подписью из заголовка запроса
    return hash === signature; // Возвращаем true, если подпись верна
  } catch (error) {
    console.error("Ошибка при проверке подписи:", error);
    return false; // Возвращаем false в случае ошибки
  }
}

(exports.createPayment = async (req, res) => {
  try {
    const { businessId, purchaseRequestId } = req.body;
    const buyerId = req.user.id;

    const purchaseRequest = await PurchaseRequests.findByPk(purchaseRequestId);

    if (!purchaseRequest) {
      return res.status(404).json({ message: "Запрос не найден" });
    }

    if (purchaseRequest.buyerId !== buyerId) {
      return res
        .status(403)
        .json({ message: "Вы не являетесь покупателем в этом запросе" });
    }

    if (purchaseRequest.status !== "accepted") {
      return res
        .status(400)
        .json({ message: "Запрос должен быть принят продавцом" });
    }

    const business = await Products.findByPk(businessId);
    if (!business) {
      return res.status(404).json({ message: "Бизнес не найден." });
    }

    const paymentData = {
      amount: {
        value: business.price.toString(),
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        return_url: "http://localhost:3000/", // Replace with your success URL
      },
      capture: true,
      description: `Оплата за бизнес ${business.name}`,
    };

    const authHeader = generateAuthHeader();
    const idempotenceKey = uuidv4();

    const response = await axios.post(
      "https://api.yookassa.ru/v3/payments",
      paymentData,
      {
        headers: {
          "Content-Type": "application/json",
          "Idempotence-Key": idempotenceKey,
          Authorization: authHeader,
        },
      }
    );

    if (response.status === 200 || response.status === 201) {
      const payment = await Payments.create({
        businessId,
        buyerId,
        sellerId: business.user_id,
        amount: business.price,
        status: "pending",
        purchaseRequestId: purchaseRequestId,
        yookassaPaymentId: response.data.id,
      });
      purchaseRequest.status = "awaiting_payment";
      await purchaseRequest.save();

      res.status(201).json({
        message: "Платеж создан. Перенаправьте пользователя для оплаты.",
        confirmationUrl: response.data.confirmation.confirmation_url,
        paymentId: payment.id,
      });
    } else {
      console.error("Ошибка при создании платежа в ЮKassa:", response.data);
      res.status(500).json({ message: "Ошибка при создании платежа." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при создании платежа." });
  }
}),
  (exports.confirm = async (req, res) => {
    try {
      const { id } = req.params; // Payment Id

      const payment = await Payments.findByPk(id);
      if (!payment) {
        return res.status(404).json({ message: "Платеж не найден." });
      }

      const buyerId = req.user.id;

      if (payment.buyerId !== buyerId) {
        return res
          .status(403)
          .json({ message: "У вас нет прав на подтверждение этого платежа." });
      }

      const business = await Products.findByPk(payment.businessId);
      if (business.buyerConfirmation === "confirmed") {
        return res
          .status(400)
          .json({ message: "Выплата уже создана для этой сделки." });
      }

      // Create Payout
      const payoutData = {
        amount: {
          value: payment.amount.toString(),
          currency: "RUB",
        },
        payout_destination: {
          type: "bank_card",
          card_number: "4141414141414141", // HARDCODED - Needs Seller Details
        },
        description: `Выплата за продажу бизнеса ${business.name}`,
      };

      const authHeader = generateAuthHeader();
      const idempotenceKey = uuidv4();

      const payoutResponse = await axios.post(
        "https://api.yookassa.ru/v3/payouts",
        payoutData,
        {
          headers: {
            "Content-Type": "application/json",
            "Idempotence-Key": idempotenceKey,
            Authorization: authHeader,
          },
        }
      );

      if (payoutResponse.status === 200 || payoutResponse.status === 201) {
        const payout = await Payouts.create({
          sellerId: business.sellerId, // Ensure to get the seller's ID
          amount: payment.amount,
          status: "pending",
          yookassaPayoutId: payoutResponse.data.id,
        });

        await Business.update(
          { buyerConfirmation: "confirmed" },
          { where: { id: payment.businessId } }
        );

        // Send confirmation emails to both seller and buyer
        const seller = await Users.findByPk(business.sellerId);
        const buyer = await Users.findByPk(buyerId); // Buyer id from req.user

        if (seller && buyer) {
          sendEmail({
            to: seller.email,
            subject: "Выплата создана!",
            text: `Выплата за продажу бизнеса ${business.name} создана и находится в процессе.`,
          });

          sendEmail({
            to: buyer.email,
            subject: "Сделка завершена!",
            text: `Вы успешно приобрели бизнес ${business.name}.`,
          });
        }

        res.json({
          message: "Получение активов подтверждено. Выплата создана.",
        });
      } else {
        console.error(
          "Ошибка при создании выплаты в ЮKassa:",
          payoutResponse.data
        );
        res.status(500).json({ message: "Ошибка при создании выплаты." });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при подтверждении платежа." });
    }
  }),
  (exports.yookassaWebhook = async (req, res) => {
    const io = req.io;
    try {
      /*
      const ipAddress = req.ip || req.connection.remoteAddress; // req.ip работает за прокси

      //  Проверяем IP-адрес
      if (!isTrustedYookassaIP(ipAddress)) {
        console.warn(`Недоверенный IP-адрес: ${ipAddress}`);
        return res.status(403).send("Unauthorized"); //  Возвращаем 403, если IP не доверенный
      }*/

      const eventType = req.body.event;
      const object = req.body.object;
      console.log(eventType, object);
      if (eventType === "payment.succeeded") {
        const yookassaPaymentId = object.id;

        const payment = await Payments.findOne({
          where: { yookassaPaymentId: yookassaPaymentId },
        });
        if (!payment) {
          return res.status(404).json({ message: "Платеж не найден" });
        }

        if (payment) {
          await Payments.update(
            { status: "succeeded" },
            { where: { yookassaPaymentId: yookassaPaymentId } }
          );

          // Find associated Business and Seller (user) details
          const business = await Products.findByPk(payment.businessId);
          const seller = await Users.findByPk(business.sellerId);
          const purchaseRequest = await PurchaseRequests.findByPk(
            payment.purchaseRequestId
          );
          if (!purchaseRequest) {
            return res
              .status(404)
              .json({ message: "Запрос на покупку не найден" });
          }

          purchaseRequest.status = "paid"; // Обновите статус
          await purchaseRequest.save(); //  Сохранение изменений

          // Создание уведомления для продавца
          const notification = await Notifications.create({
            userId: purchaseRequest.sellerId,
            message: `Оплата за бизнес ${business.name} прошла успешно.`,
            type: "payment",
            purchaseRequestId: purchaseRequest.id,
          });

          if (io && io.to) {
            io.to(purchaseRequest.sellerId).emit(
              "new_notification",
              notification
            );
          }

          // Send email notification to the seller
          if (seller) {
            sendEmail({
              to: seller.email,
              subject: "Уведомление об оплате!",
              text: `Покупатель оплатил бизнес ${business.name}. Пожалуйста, свяжитесь с ним для передачи активов.`,
            });
            console.log(
              `Payment ${yookassaPaymentId} updated to completed and notification sent to seller`
            );
          } else {
            console.warn("No seller could be found for this payment.");
          }
        }
      } else if (
        eventType === "payment.canceled" ||
        eventType === "payment.waiting_for_capture"
      ) {
        // Обработка отмененных и не завершенных платежей (например, из-за недостатка средств)
        const yookassaPaymentId = object.id;

        const payment = await Payments.findOne({
          where: { yookassaPaymentId: yookassaPaymentId },
        });

        if (!payment) {
          console.warn(`Платеж не найден в БД: ${yookassaPaymentId}`);
          return res.status(404).json({ message: "Платеж не найден" });
        }

        //  Проверяем текущий статус платежа
        if (
          payment.status === "canceled" ||
          payment.status === "waiting_for_capture"
        ) {
          console.warn(
            `Повторное уведомление об отмене/ожидании: ${yookassaPaymentId}`
          );
          return res.status(200).send("OK"); // Игнорируем повторные уведомления
        }

        // Обновляем статус платежа в БД
        await Payments.update(
          {
            status:
              eventType === "payment.canceled"
                ? "canceled"
                : "waiting_for_capture",
          },
          { where: { yookassaPaymentId: yookassaPaymentId } }
        );

        const purchaseRequest = await PurchaseRequests.findByPk(
          payment.purchaseRequestId
        );
        if (!purchaseRequest) {
          console.warn(
            `Запрос на покупку не найден: ${payment.purchaseRequestId}`
          );
          return res
            .status(404)
            .json({ message: "Запрос на покупку не найден" });
        }

        // Обновляем статус PurchaseRequest
        purchaseRequest.status = "canceled"; // Или другой подходящий статус
        await purchaseRequest.save();

        // Отправляем уведомление покупателю
        if (purchaseRequest.buyerId) {
          const notification = await Notifications.create({
            userId: purchaseRequest.sellerId,
            message: `Оплата за бизнес ${business.name} прошла успешно.`,
            type: "payment",
            purchaseRequestId: purchaseRequest.id,
          });
        } else {
          console.warn(
            `ID покупателя не найден для запроса ${purchaseRequest.id}`
          );
        }
      } else if (eventType === "payout.succeeded") {
        const yookassaPayoutId = object.id;

        const payout = await Payouts.findOne({
          where: { yookassaPayoutId: yookassaPayoutId },
        });

        if (payout) {
          await Payouts.update(
            { status: "completed" },
            { where: { yookassaPayoutId: yookassaPayoutId } }
          );
          console.log(`Payout ${yookassaPayoutId} updated to completed`);
        }
      }

      res.status(200).send("Webhook received successfully");
    } catch (error) {
      console.error("Error processing YooKassa webhook:", error);
      res.status(500).send("Error processing webhook");
    }
  });
