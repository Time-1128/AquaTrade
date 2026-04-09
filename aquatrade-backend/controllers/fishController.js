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

    const parsedFish = fish.map((item) => {
      if (item.fishTypes && typeof item.fishTypes === "string") {
        try {
          return { ...item, fishTypes: JSON.parse(item.fishTypes) };
        } catch {
          return { ...item, fishTypes: [item.fishTypes] };
        }
      }
      return item;
    });

    res.json(parsedFish);

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
    const catchDateTime = req.body.catchDateTime || null;

    // Calculate freshness based on catch time
    let freshness = 90; // default freshness
    if (catchDateTime) {
      const catchTime = new Date(catchDateTime);
      const now = new Date();
      const hoursSinceCatch = (now - catchTime) / (1000 * 60 * 60);

      // Freshness decreases over time (max 100% for very fresh, min 50% for very old)
      freshness = Math.max(50, 100 - (hoursSinceCatch * 2));
    }

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

    /* FISH TYPES — parse array sent as JSON string from frontend */

    let fishTypes = [];

    if (req.body.fishTypes) {
      try {
        fishTypes = JSON.parse(req.body.fishTypes);
      } catch {
        fishTypes = Array.isArray(req.body.fishTypes)
          ? req.body.fishTypes
          : [req.body.fishTypes];
      }
    }

    const sellerAddress = req.body.address || "";

    const newFish = {

      name: req.body.name,

      fishTypes: fishTypes,

      price: aiPrice,

      stock: stock,

      type: req.body.type || "Sea water",

      category: req.body.category || "Fish",

      freshness: freshness,

      catchDateTime: catchDateTime,

      description: req.body.description || "",

      location: {
        address: sellerAddress
      },

      address: sellerAddress,

      sellerAddress: sellerAddress,

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

      aiDiscount: aiDiscount,

      fishTypes: fishTypes,

      address: sellerAddress,

      sellerAddress: sellerAddress,

      location: { address: sellerAddress }

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