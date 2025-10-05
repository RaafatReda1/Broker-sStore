/* eslint-disable react/prop-types */
import React, { useContext } from "react";
import "./Product.css";
import { cartContext, userDataContext } from "../../AppContexts";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

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

  return (
    <div className="card">
      <Link to={`/productPage/productId:${id}`}>
        <img src={src} alt="" />
      </Link>
      <h3>{name}</h3>
      <h5>{description}</h5>
      <h5 className="price">{price}$</h5>

      <div className="productBtns">
        {!userData && (
          <button type="button" onClick={handleAddToCart}>
            Add to cart
          </button>
        )}
        {userData && (
          <button
            type="button"
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
            disabled = {userData.isVerified === false}
          >
            Copy Link
          </button>
        )}
      </div>
    </div>
  );
};

export default Product;
