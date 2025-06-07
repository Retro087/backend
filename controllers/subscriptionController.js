const Subscription = require("../models/Subscription");
const UserSubscription = require("../models/UserSubscription");

exports.createSubscription = async (req, res) => {
  const { subscriptionTypeId } = req.body; // Предполагается, что тип подписки передается в теле запроса
  try {
    const subscription = await Subscription.create({
      userId: req.user.id,
      subscriptionTypeId,
      status: "active",
      startDate: new Date(),
      endDate: calculateEndDate(subscriptionTypeId),
    });
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id },
    });
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll();
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubscription = async (req, res) => {
  const { updates } = req.body; // Предполагается, что обновления передаются в теле запроса
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id },
    });
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    await subscription.update(updates);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.extendSubscription = async (req, res) => {
  const { additionalDays } = req.body; // Количество дополнительных дней передается в теле запроса
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id },
    });
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    subscription.endDate = new Date(subscription.endDate);
    subscription.endDate.setDate(
      subscription.endDate.getDate() + additionalDays
    );
    await subscription.save();
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id },
    });
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    subscription.status = "cancelled";
    await subscription.save();
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkSubscriptionStatus = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id },
    });
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    res.json({ status: subscription.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateExpiredSubscriptions = async (req, res) => {
  try {
    const now = new Date();
    const [updatedCount] = await Subscription.update(
      { status: "expired" },
      {
        where: {
          endDate: {
            [Sequelize.Op.lt]: now,
          },
          status: "active",
        },
      }
    );
    res.json({ message: `${updatedCount} subscriptions updated to expired` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserSubscriptions = async (req, res) => {
  try {
    const userSubscriptions = await Subscription.findAll({
      where: { userId: req.user.id },
    });
    res.json(userSubscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubscriptionDetails = async (req, res) => {
  const { subscriptionId } = req.params; // Предполагается, что ID подписки передается в параметрах запроса
  try {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
