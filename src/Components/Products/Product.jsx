/* eslint-disable react/prop-types */
import React, { useContext } from "react";
import "./Product.css";
import { cartContext, userDataContext } from "../../AppContexts";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, Share2, ShoppingCart } from "lucide-react";

const Product = ({
  id,
  name,
  description,
  price,
  src,
  images,
  fullDescription,
  profit,
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
    // localStorage is now handled in App.jsx

    toast.success("Added to cart!");
  };

  const handleShare = async () => {
    const productUrl = `${window.location.origin}/productPage/productId:${id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: name,
          text: description,
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

  return (
    <div className="card">
      <div className="card-image-container">
        <Link to={`/productPage/productId:${id}`}>
          <img src={src} alt={name} />
        </Link>
        <div className="card-overlay">
          <Link
            to={`/productPage/productId:${id}`}
            className="overlay-btn view-btn"
          >
            <Eye size={20} />
            <span>View</span>
          </Link>
          {!userData && (
            <button className="overlay-btn cart-btn" onClick={handleAddToCart}>
              <ShoppingCart size={20} />
              <span>Add to Cart</span>
            </button>
          )}
          <button className="overlay-btn share-btn" onClick={handleShare}>
            <Share2 size={20} />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="card-content">
        <h3 className="product-name">{name}</h3>
        <p className="product-description">{description}</p>
        <div className="price-container">
          <span className="price">${price}</span>
          {userData && profit && (
            <span className="profit">Profit: ${profit}</span>
          )}
        </div>
      </div>

      <div className="productBtns">
        {!userData && (
          <button
            type="button"
            className="add-to-cart-btn"
            onClick={handleAddToCart}
          >
            <ShoppingCart size={16} />
            Add to cart
          </button>
        )}
        {userData && (
          <button
            type="button"
            className="copy-link-btn"
            onClick={async () => {
              try {
                const copiedTxt = await navigator.clipboard.writeText(
                  window.location.href +
                    "productPage/productId:" +
                    id +
                    "?brokerId=" +
                    userData.id
                );
                toast.success("Link copied to clipboard!");
              } catch (err) {
                console.error("Failed to copy: ", err);
                toast.error("Failed to copy link. Please try again.");
              }
            }}
            disabled={userData.isVerified === false}
          >
            <Share2 size={16} />
            Copy Link
          </button>
        )}
      </div>
    </div>
  );
};

export default Product;
