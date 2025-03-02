const crypto = require("crypto");

const generateSignature = (data, secretKey) => {
  const stringifiedData = Object.values(data).join(";");
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(stringifiedData);
  return hmac.digest("hex");
};

module.exports = generateSignature;
