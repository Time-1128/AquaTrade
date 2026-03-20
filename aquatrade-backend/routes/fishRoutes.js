const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { getFish, createFish } = require("../controllers/fishController");

/* MULTER CONFIG */

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {

    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));

  }

});

const upload = multer({ storage });

/* ROUTES */

router.get("/", getFish);

/* IMAGE UPLOAD ROUTE */

router.post("/", upload.single("image"), createFish);

module.exports = router;