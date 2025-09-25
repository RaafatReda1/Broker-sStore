import { useState, useContext } from "react";
import "./ProductPage.css";
import {
  currentProductContext,
  cartContext,
  currentPageContext,
  userDataContext,
} from "../../AppContexts";
import PDF from "../PDF/PDF";

const ProductPage = () => {
  const { currentProduct } = useContext(currentProductContext);
  const { cart, setCart } = useContext(cartContext);
  const { setcurrentPage } = useContext(currentPageContext);
  const {userData} = useContext(userDataContext)
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
    // localStorage is now handled in App.jsx
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
          {userData && (
            <p>Profit: {currentProduct.profit}$</p>
          )}

          {!userData && (
            <div className="quantity">
              <label>Quantity:</label>
              <input
                type="number"
                value={quantity}
                min="1"
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value)))
                }
              />
            </div>
          )}

          {userData ? (
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
                      window.location.href + "?brokerId=" + userData.id
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
              <button
                className="btn checkout"
                onClick={() => {
                  setcurrentPage("cart");
                  handleAddToCart(currentProduct, 1);
                }}
              >
                Go to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
