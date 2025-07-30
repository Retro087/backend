const express = require("express");

const {
  createSocialMedia,
  getAllSocials,
  updateSocial,
  deleteSocial,
} = require("../controllers/socialMediaController");
const router = express.Router();

router.post("/:id", createSocialMedia);
router.get("/:id", getAllSocials);
router.put("/", updateSocial);
router.delete("/:id", deleteSocial);

module.exports = router;
