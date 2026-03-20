/* =================================
   AQUATRADE AI PRICING ENGINE
   Smart Dynamic Fish Pricing
================================= */

function calculateDemandFactor(stock) {

  if (stock <= 5) return 1.25;   // very rare
  if (stock <= 15) return 1.15;  // medium
  if (stock <= 30) return 1.05;  // normal
  return 0.9;                    // oversupply

}

function freshnessFactor(freshness) {

  if (freshness >= 95) return 1.2;
  if (freshness >= 85) return 1.1;
  if (freshness >= 70) return 1.0;
  return 0.85;

}

function timeFactor() {

  const hour = new Date().getHours();

  /* Evening discount to sell remaining fish */

  if (hour >= 18) return 0.85;

  /* Morning premium fresh catch */

  if (hour <= 9) return 1.15;

  return 1.0;

}

/* ================================
   MAIN AI PRICE FUNCTION
================================ */

function predictPrice(basePrice, stock, freshness) {

  const demand = calculateDemandFactor(stock);

  const fresh = freshnessFactor(freshness);

  const time = timeFactor();

  let predictedPrice = basePrice * demand * fresh * time;

  predictedPrice = Math.round(predictedPrice);

  return predictedPrice;

}

/* =================================
   DISCOUNT SUGGESTION AI
================================= */

function suggestDiscount(stock, freshness) {

  if (stock > 40) return 15;

  if (freshness < 75) return 20;

  if (freshness < 60) return 30;

  return 0;

}

/* =================================
   EXPORT
================================= */

module.exports = {

  predictPrice,
  suggestDiscount

};