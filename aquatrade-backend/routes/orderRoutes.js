const express = require("express");
const router = express.Router();

const {
  createBooking,
  getOrders,
  getSellerBookings
} = require("../controllers/orderController");

router.post("/book", createBooking);
router.get("/", getOrders);
router.get("/seller", getSellerBookings);

module.exports = router;