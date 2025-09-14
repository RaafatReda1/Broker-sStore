import React, { useContext } from "react";
import "./Cart.css";
import { cartContext, currentPageContext, currentProductContext } from "../../App";
import CheckOut from "../CheckOut/CheckOut";

export default function Cart() {
  const { cart, setCart } = useContext(cartContext);
  const { setCurrentProduct } = useContext(currentProductContext);
  const { setcurrentPage } = useContext(currentPageContext);

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
    localStorage.setItem("cart", JSON.stringify(updatedCart));
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
              <li
                key={index}
                className="cart-item"
                onClick={() => {
                  setCurrentProduct(item); // مرر المنتج المختار
                  setcurrentPage("productPage"); // روح لصفحة المنتج
                }}
              >
                <img src={item.image} alt={item.name} className="cart-image" />
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
                  }}
                >
                  Remove
                </button>
              </li>
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
                localStorage.removeItem("cart");
              }}
            >
              Remove All
            </button>
          </div>
        </>
      )}
    </div>
    <CheckOut/>
    </>
  );
}
