import { useApp } from "../context/AppContext";

export default function FishCard({ fish, onAdd }) {

  const { state, dispatch } = useApp();

  const freshness = fish.freshness || 80;

  const freshnessColor =
    freshness >= 90
      ? "#2ECC71"
      : freshness >= 75
      ? "#F6C90E"
      : "#E74C3C";

  const stock = Number(fish.stock || 0);

  const cartItem = state.cart.find((i) => i.id === fish.id);
  const cartQty = cartItem ? cartItem.qty : 0;

  const remainingStock = stock - cartQty;

  const canAdd = remainingStock > 0;

  const handleAdd = (e) => {

    e.stopPropagation();

    if (!canAdd) {
      alert("Maximum stock reached");
      return;
    }

    onAdd();

  };

  /* IMAGE NORMALIZATION */

  let imageUrl = null;

  if (fish.image && fish.image !== "🐟") {

    if (fish.image.startsWith("http")) {
      imageUrl = fish.image;
    } else {
      imageUrl = `http://localhost:5000/${fish.image}`;
    }

  }

  return (

    <div
      className="card"
      style={{
        cursor: "pointer",
        overflow: "visible",
        position: "relative",
        opacity: stock === 0 ? 0.6 : 1
      }}
      onClick={() => dispatch({ type: "SELECT_PRODUCT", payload: fish })}
    >

      {fish.discount ? (

        <div
          style={{
            position: "absolute",
            top: "-6px",
            left: "10px",
            background: "#FF6B6B",
            color: "white",
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: 800
          }}
        >
          {fish.discount}% OFF
        </div>

      ) : null}

      <div
        style={{
          background: `${fish.color || "#00B4D8"}20`,
          padding: "20px",
          textAlign: "center",
          fontSize: "48px"
        }}
      >

        {imageUrl ? (

          <img
            src={imageUrl}
            alt={fish.name}
            style={{
              width: "80px",
              height: "80px",
              objectFit: "cover",
              borderRadius: "10px"
            }}
          />

        ) : (

          fish.image || "🐟"

        )}

        <div
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: freshnessColor
          }}
        />

      </div>

      <div style={{ padding: "12px" }}>

        <h3 style={{ fontSize: "14px", fontWeight: 700 }}>
          {fish.name}
        </h3>

        <div style={{ fontSize: "12px", color: "#888" }}>
          ⭐ {fish.rating || 4.5} ({fish.reviews || 0})
        </div>

        <div
          style={{
            fontSize: "12px",
            marginTop: "4px",
            fontWeight: 600,
            color: stock === 0 ? "#E74C3C" : "#555"
          }}
        >
          {stock === 0
            ? "Out of Stock"
            : `Available: ${remainingStock} kg`}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "8px"
          }}
        >

          <div style={{ fontWeight: 800 }}>
            ₹{fish.price}/kg
          </div>

          <button
            disabled={!canAdd}
            onClick={handleAdd}
            style={{
              background: canAdd ? "#00B4D8" : "#ccc",
              border: "none",
              borderRadius: "8px",
              color: "white",
              width: "28px",
              height: "28px",
              cursor: canAdd ? "pointer" : "not-allowed"
            }}
          >
            +
          </button>

        </div>

      </div>

    </div>

  );

}