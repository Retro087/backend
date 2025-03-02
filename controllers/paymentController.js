const { authenticateToken } = require("../middleware/authMiddleware");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Products = require("../models/Products");
const Payments = require("../models/Payments");
const AssetTransfer = require("../models/AssetTransfer");
const Payouts = require("../models/Payouts");
const Users = require("../models/Users");

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;

const generateAuthHeader = () => {
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  return `Basic ${auth}`;
};

(exports.createPayment = async (req, res) => {
  try {
    const { businessId } = req.body;
    const buyerId = req.user.id;

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
      capture: false,
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
        yookassaPaymentId: response.data.id,
      });

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
    console.log("rsgdrg");
    try {
      const eventType = req.body.event;
      const object = req.body.object;

      if (eventType === "payment.succeeded") {
        const yookassaPaymentId = object.id;

        const payment = await Payments.findOne({
          where: { yookassaPaymentId: yookassaPaymentId },
        });

        if (payment) {
          await Payments.update(
            { status: "completed" },
            { where: { yookassaPaymentId: yookassaPaymentId } }
          );

          // Find associated Business and Seller (user) details
          const business = await Products.findByPk(payment.businessId);
          const seller = await Users.findByPk(business.sellerId);

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
