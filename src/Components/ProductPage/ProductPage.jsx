import { useState, useContext } from "react";
import "./ProductPage.css";
import { currentProductContext, userContext, cartContext } from "../../App";
import PDF from "../PDF/PDF";

const ProductPage = () => {
  const { currentProduct } = useContext(currentProductContext);
  const { user } = useContext(userContext);
  const { cart, setCart } = useContext(cartContext);

  const [currentImage, setCurrentImage] = useState(
    currentProduct.images?.[0] || currentProduct.image
  );
  const [quantity, setQuantity] = useState(1);

  // Add to cart logic using currentProduct and quantity
  const handleAddToCart = (product, qty = 1) => {
    const existingProductIndex = cart.findIndex(
      (item) => item.id === product.id
    );

    let updatedCart;

    if (existingProductIndex !== -1) {
      updatedCart = cart.map((item, index) =>
        index === existingProductIndex
          ? { ...item, quantity: item.quantity + qty }
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: qty }];
    }

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    alert("Added to cart!");
  };

  return (
    <div className="product-page">
      <div className="product-card">
        {/* Left: Images */}
        <div className="product-images">
          <img
            src={currentImage}
            alt={currentProduct.name}
            className="main-image"
          />
          <div className="thumbnails">
            {currentProduct.images?.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={currentProduct.name}
                className="thumbnail"
                onClick={() => setCurrentImage(img)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </div>
        </div>

        {/* Right: Details */}
        <div className="product-details">
          <h2>{currentProduct.name}</h2>
          <p className="description">{currentProduct.description}</p>
          <p className="price">{currentProduct.price}$</p>

          {user.authority === "broker" && (
            <p>Profit: {currentProduct.profit}$</p>
          )}

          {user.authority !== "broker" &&<div className="quantity">
            <label>Quantity:</label>
            <input
              type="number"
              value={quantity}
              min="1"
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
          </div>}

          {user.authority === "broker" ? (
            <div className="buttons">
              <PDF
                name={currentProduct.name}
                fullDescription={currentProduct.fullDescription}
                Images={currentProduct.images}
                price={currentProduct.price}
                profit={currentProduct.profit}
              ></PDF>
              <button
                className="btn copy-link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      window.location.href + "?brokerId=" + user.id
                    );
                    alert("Copied to clipboard!");
                  } catch (err) {
                    console.error("Failed to copy: ", err);
                  }
                }}
              >
                Copy Link
              </button>
            </div>
          ) : (
            <div className="buttons">
              <button
                className="btn add-to-cart"
                onClick={() => handleAddToCart(currentProduct, quantity)}
              >
                Add to Cart
              </button>
              <button className="btn checkout">Go to Checkout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
