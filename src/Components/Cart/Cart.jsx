import React, { useContext } from "react";
import "./Cart.css";
import { cartContext, currentProductContext } from "../../AppContexts";
import CheckOut from "../CheckOut/CheckOut";
import { Link } from "react-router-dom";

export default function Cart() {
  const { cart, setCart } = useContext(cartContext);
  const { setCurrentProduct } = useContext(currentProductContext);

  // حساب الإجمالي
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleRemove = (id) => {
    const updatedCart = cart
      .map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity - 1 } // نقص الكمية
          : item
      )
      .filter((item) => item.quantity > 0); // شيل العناصر اللي الكمية = 0

    setCart(updatedCart);
    // localStorage is now handled in App.jsx
  };

  return (
    <>
      <div className="cart">
        <h2 className="cart-title">🛒 Shopping Cart</h2>

        {cart.length === 0 ? (
          <p className="empty-cart">Your cart is empty</p>
        ) : (
          <>
            <ul className="cart-list">
              {cart.map((item, index) => (
                <Link key={index} to="/productPage">
                  <li
                    key={index}
                    className="cart-item"
                    onClick={() => {
                      setCurrentProduct(item); // مرر المنتج المختار
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="cart-image"
                    />
                    <div className="cart-details">
                      <h3>{item.name}</h3>
                      <p>
                        ${item.price} × {item.quantity} ={" "}
                        <strong>${item.price * item.quantity}</strong>
                      </p>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // عشان ما يفتحش المنتج لما تدوس remove
                        handleRemove(item.id);
                        e.preventDefault()
                      }}
                    >
                      Remove
                    </button>
                  </li>
                </Link>
              ))}
            </ul>

            <div className="cart-footer">
              <p className="total">
                Total: <span>${total}</span>
              </p>
              <button
                className="removeAll-btn"
                onClick={() => {
                  setCart([]);
                  // localStorage is now handled in App.jsx
                }}
              >
                Remove All
              </button>
            </div>
          </>
        )}
      </div>
      <CheckOut />
    </>
  );
}
