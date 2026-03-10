const { getAllFish, addFish } = require("../models/fishModel");

/* AI PRICING ENGINE */

const {
  predictPrice,
  suggestDiscount
} = require("../services/pricingAI");


/* ==============================
   GET ALL FISH
============================== */

const getFish = async (req, res) => {

  try {

    const fish = await getAllFish();

    res.json(fish);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to fetch fish"
    });

  }

};


/* ==============================
   ADD NEW FISH (WITH AI PRICING)
============================== */

const createFish = async (req, res) => {

  try {

    const basePrice = Number(req.body.price || 0);
    const stock = Number(req.body.stock || 0);
    const freshness = Number(req.body.freshness || 90);

    const aiPrice = predictPrice(
      basePrice,
      stock,
      freshness
    );

    const aiDiscount = suggestDiscount(
      stock,
      freshness
    );

    /* IMAGE PATH FIX */

    let imagePath = "🐟";

    if (req.file) {
      imagePath = `uploads/${req.file.filename}`;
    }

    const newFish = {

      name: req.body.name,

      price: aiPrice,

      stock: stock,

      type: req.body.type || "Sea water",

      category: req.body.category || "Fish",

      freshness: freshness,

      description: req.body.description || "",

      rating: req.body.rating || 4.5,

      reviews: req.body.reviews || 0,

      sellerName: req.body.sellerName || "Unknown Seller",

      sellerDist: req.body.sellerDist || 0,

      eta: req.body.eta || "",

      discount: aiDiscount,

      image: imagePath,

      color: req.body.color || "#00B4D8"

    };

    const result = await addFish(newFish);

    res.json({

      message: "Fish added successfully",

      id: result.insertId,

      image: imagePath,

      aiPrice: aiPrice,

      aiDiscount: aiDiscount

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to add fish"
    });

  }

};


module.exports = {

  getFish,
  createFish

};