import React, { useState, useContext, useEffect } from "react";
import "./ProductPage.css";
import {
  userContext,
  cartContext,
  productsContext,
  userDataContext,
} from "../../AppContexts";
import PDF from "../PDF/PDF";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const ProductPage = () => {
  const { products } = useContext(productsContext);
  const { user } = useContext(userContext);
  const { cart, setCart } = useContext(cartContext);
  const { userData } = useContext(userDataContext);
  // Extract product ID from URL path
  const path = window.location.pathname;
  const productIdMatch = path.match(/productId:(\d+)/);
  const productId = productIdMatch ? parseInt(productIdMatch[1]) : null;

  // Find the product from products array
  const currentProduct = products.find((product) => product.id === productId);

  const [currentImage, setCurrentImage] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Update currentImage when currentProduct is found
  useEffect(() => {
    if (currentProduct) {
      setCurrentImage(currentProduct.images?.[0] || currentProduct.image);
    }
  }, [currentProduct]);

  // Show loading or error if product is not found
  if (!currentProduct) {
    return (
      <div className="product-page">
        <div className="product-card">
          {products.length === 0 && <h2>Loading product...</h2>}
          {products.length > 0 && <p>Product not found</p>}
        </div>
      </div>
    );
  }

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
    toast.success("Added to cart!");
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
          {userData && <p>Profit: {currentProduct.profit}$</p>}

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
                    toast.success("Link copied to clipboard!");
                  } catch (err) {
                    console.error("Failed to copy: ", err);
                    toast.error("Failed to copy link. Please try again.");
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
              <Link to="/cart">
                <button className="btn checkout" onClick={() => {}}>
                  Go to Checkout
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
