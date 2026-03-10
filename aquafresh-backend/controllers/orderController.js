const db = require("../config/database");

/* ===============================
   CREATE BOOKING (PRE-BOOK FISH)
================================ */

exports.createBooking = (req, res) => {

  const { user_id, fish_id, quantity, pickup_time } = req.body;

  if (!user_id || !fish_id || !quantity) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const getFishQuery = "SELECT price, stock, sellerName FROM fish WHERE id = ?";

  db.query(getFishQuery, [fish_id], (err, result) => {

    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.json({ message: "Fish not found" });
    }

    const fish = result[0];

    if (fish.stock < quantity) {
      return res.json({
        message: "Not enough stock available"
      });
    }

    const total = fish.price * quantity;

    const createOrderQuery = `
      INSERT INTO orders (user_id, total_amount, status, pickup_time)
      VALUES (?, ?, 'booked', ?)
    `;

    db.query(createOrderQuery, [user_id, total, pickup_time], (err, orderResult) => {

      if (err) return res.status(500).json(err);

      const orderId = orderResult.insertId;

      const orderItemQuery = `
        INSERT INTO order_items (order_id, fish_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `;

      db.query(orderItemQuery, [orderId, fish_id, quantity, fish.price], (err) => {

        if (err) return res.status(500).json(err);

        const updateStockQuery = `
          UPDATE fish
          SET stock = stock - ?
          WHERE id = ?
        `;

        db.query(updateStockQuery, [quantity, fish_id], (err) => {

          if (err) return res.status(500).json(err);

          /* REALTIME STOCK UPDATE */

          const io = req.app.get("io");

          if (io) {
            io.emit("stockUpdated", { fish_id });
          }

          res.json({
            message: "Booking successful",
            order_id: orderId,
            fish_id: fish_id
          });

        });

      });

    });

  });

};


/* ===============================
   GET ALL BOOKINGS
================================ */

exports.getOrders = (req, res) => {

  const query = `
    SELECT 
      orders.id,
      orders.total_amount,
      orders.status,
      orders.pickup_time,
      orders.created_at
    FROM orders
    ORDER BY orders.created_at DESC
  `;

  db.query(query, (err, results) => {

    if (err) return res.status(500).json(err);

    res.json(results);

  });

};


/* ===============================
   SELLER BOOKINGS (NOTIFICATIONS)
================================ */

exports.getSellerBookings = (req, res) => {

  const query = `
    SELECT 
      orders.id AS order_id,
      orders.pickup_time,
      orders.status,
      order_items.quantity,
      fish.name,
      fish.sellerName
    FROM orders
    JOIN order_items 
      ON orders.id = order_items.order_id
    JOIN fish 
      ON fish.id = order_items.fish_id
    ORDER BY orders.created_at DESC
  `;

  db.query(query, (err, results) => {

    if (err) return res.status(500).json(err);

    res.json(results);

  });

};