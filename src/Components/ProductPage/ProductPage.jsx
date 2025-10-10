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
import {
  Share2,
  ShoppingCart,
  Eye,
  ArrowLeft,
  Heart,
  Download,
  ZoomIn,
  X,
} from "lucide-react";

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
  const [showImagePreview, setShowImagePreview] = useState(false);

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

  const handleQuantityChange = (change) => {
    setQuantity((prevQuantity) => Math.max(1, prevQuantity + change));
  };

  const handleShare = async () => {
    const productUrl = `${window.location.origin}/productPage/productId:${productId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentProduct.name,
          text: currentProduct.description,
          url: productUrl,
        });
      } else {
        await navigator.clipboard.writeText(productUrl);
        toast.success("Product link copied to clipboard!");
      }
    } catch (err) {
      console.error("Failed to share:", err);
      toast.error("Failed to share product. Please try again.");
    }
  };

  const handlePreviewImage = () => {
    setShowImagePreview(true);
  };

  const closeImagePreview = () => {
    setShowImagePreview(false);
  };

  return (
    <div className="product-page">
      <div className="product-card">
        {/* Back Button */}
        <div className="back-button-container">
          <Link to="/products" className="back-button">
            <ArrowLeft size={20} />
            <span>Back to Products</span>
          </Link>
        </div>

        {/* Left: Images */}
        <div className="product-images">
          <div className="main-image-container">
            <img
              src={currentImage}
              alt={currentProduct.name}
              className="main-image"
            />
            <div className="image-overlay">
              <button className="overlay-action-btn" onClick={handleShare}>
                <Share2 size={20} />
                <span>Share</span>
              </button>
              <button
                className="overlay-action-btn preview-btn"
                onClick={handlePreviewImage}
              >
                <ZoomIn size={20} />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {currentProduct.images?.length > 1 && (
            <div className="thumbnails">
              {currentProduct.images?.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={currentProduct.name}
                  className={`thumbnail ${
                    currentImage === img ? "active" : ""
                  }`}
                  onClick={() => setCurrentImage(img)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="product-details">
          <div className="product-header">
            <h1 className="product-title">{currentProduct.name}</h1>
            <div className="product-badges">
              {userData && (
                <span className="badge broker-badge">Broker View</span>
              )}
              <span className="badge available-badge">Available</span>
            </div>
          </div>

          <p className="product-description">{currentProduct.description}</p>

          <div className="price-section">
            <div className="price-container">
              <span className="price-label">Price</span>
              <span className="price-value">${currentProduct.price}</span>
            </div>
            {userData && currentProduct.profit && (
              <div className="profit-container">
                <span className="profit-label">Your Profit</span>
                <span className="profit-value">${currentProduct.profit}</span>
              </div>
            )}
          </div>

          {!userData && (
            <div className="quantity-section">
              <label className="quantity-label">Quantity</label>
              <div className="quantity-controls">
                <button
                  className="quantity-btn minus"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  min="1"
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value)))
                  }
                  className="quantity-input"
                />
                <button
                  className="quantity-btn plus"
                  onClick={() => handleQuantityChange(1)}
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="action-buttons">
            {userData ? (
              <>
                <PDF
                  name={currentProduct.name}
                  fullDescription={currentProduct.fullDescription}
                  Images={currentProduct.images}
                  price={currentProduct.price}
                  profit={currentProduct.profit}
                >
                  <button className="action-btn pdf-btn">
                    <Download size={20} />
                    <span>Download PDF</span>
                  </button>
                </PDF>
                <button
                  className="action-btn copy-link-btn"
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
                  disabled={userData.isVerified === false}
                >
                  <Share2 size={20} />
                  <span>Copy Link</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="action-btn add-to-cart-btn"
                  onClick={() => handleAddToCart(currentProduct, quantity)}
                >
                  <ShoppingCart size={20} />
                  <span>Add to Cart</span>
                </button>
                <Link to="/cart">
                  <button className="action-btn checkout-btn">
                    <Eye size={20} />
                    <span>View Cart</span>
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="image-preview-modal" onClick={closeImagePreview}>
          <div
            className="image-preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-preview-btn" onClick={closeImagePreview}>
              <X size={24} />
            </button>
            <div className="preview-image-container">
              <img
                src={currentImage}
                alt={currentProduct.name}
                className="preview-image"
              />
            </div>
            <div className="preview-thumbnails">
              {currentProduct.images?.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={currentProduct.name}
                  className={`preview-thumbnail ${
                    currentImage === img ? "active" : ""
                  }`}
                  onClick={() => setCurrentImage(img)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
