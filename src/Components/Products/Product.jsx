/* eslint-disable react/prop-types */
import React, { useContext } from "react";
import "./Product.css";
import { cartContext, userDataContext } from "../../AppContexts";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart,
  faEye,
  faShare,
} from "@fortawesome/free-solid-svg-icons";

const Product = ({
  id,
  name,
  description,
  price,
  src,
  images,
  fullDescription,
  profit,
  discount = 0,
  isNew = false,
  isFeatured = false,
}) => {
  const { cart, setCart } = useContext(cartContext);
  const { userData } = useContext(userDataContext);

  const handleAddToCart = () => {
    const existingProductIndex = cart.findIndex((item) => item.id === id);

    let updatedCart;

    if (existingProductIndex !== -1) {
      updatedCart = cart.map((item, index) =>
        index === existingProductIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      const product = {
        id,
        name,
        description,
        price,
        image: src,
        images,
        fullDescription,
        profit,
        quantity: 1,
      };
      updatedCart = [...cart, product];
    }

    setCart(updatedCart);
    toast.success("Added to cart!");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: name,
        text: description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const calculateDiscountedPrice = () => {
    return discount > 0 ? price * (1 - discount / 100) : price;
  };

  return (
    <div className="product-card">
      {/* Product Badges */}
      <div className="product-badges">
        {isNew && <span className="badge new">NEW</span>}
        {isFeatured && <span className="badge featured">FEATURED</span>}
        {discount > 0 && <span className="badge discount">-{discount}%</span>}
      </div>

      {/* Product Image */}
      <div className="product-image-container">
        <Link to={`/productPage/productId:${id}`}>
          <img src={src} alt={name} className="product-image" />
        </Link>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button
            className="action-btn share"
            onClick={handleShare}
            title="Share"
          >
            <FontAwesomeIcon icon={faShare} />
          </button>
          <Link
            to={`/productPage/productId:${id}`}
            className="action-btn view"
            title="Quick view"
          >
            <FontAwesomeIcon icon={faEye} />
          </Link>
        </div>
      </div>

      {/* Product Info */}
      <div className="product-info">
        <h3 className="product-name">
          <Link to={`/productPage/productId:${id}`}>{name}</Link>
        </h3>

        <p className="product-description">{description}</p>

        <div className="product-price">
          {discount > 0 ? (
            <div className="price-container">
              <span className="current-price">
                ${calculateDiscountedPrice().toFixed(2)}
              </span>
              <span className="original-price">${price}</span>
            </div>
          ) : (
            <span className="current-price">${price}</span>
          )}
          {userData && profit && (
            <span className="profit-info">Profit: ${profit}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="product-actions">
          {!userData && (
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              <FontAwesomeIcon icon={faShoppingCart} />
              Add to Cart
            </button>
          )}
          {userData && (
            <button
              className="broker-link-btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    window.location.href +
                      "productPage/productId:" +
                      id +
                      "?brokerId=" +
                      userData.id
                  );
                  toast.success("Link copied to clipboard!");
                } catch (err) {
                  console.error("Failed to copy: ", err);
                  toast.error("Failed to copy link");
                }
              }}
              disabled={userData.isVerified === false}
            >
              <FontAwesomeIcon icon={faShare} />
              Copy Link
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Product;
