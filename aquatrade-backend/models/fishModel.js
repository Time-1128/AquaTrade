const db = require("../config/database");

function getAllFish() {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM fish", (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function addFish(fish) {
  return new Promise((resolve, reject) => {

    const query = `
      INSERT INTO fish
      (name, price, stock, type, category, freshness, catchDateTime, description,
       rating, reviews, sellerName, sellerDist, eta, discount, image, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      fish.name,
      fish.price,
      fish.stock,
      fish.type,
      fish.category,
      fish.freshness,
      fish.catchDateTime,
      fish.description,
      fish.rating,
      fish.reviews,
      fish.sellerName,
      fish.sellerDist,
      fish.eta,
      fish.discount,
      fish.image,
      fish.color
    ];

    db.query(query, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });

  });
}

module.exports = {
  getAllFish,
  addFish
};