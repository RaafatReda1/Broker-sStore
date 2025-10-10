import React, { useContext } from "react";
import "./Cart.css";
import { cartContext } from "../../AppContexts";
import CheckOut from "../CheckOut/CheckOut";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  ArrowLeft,
} from "lucide-react";

export default function Cart() {
  const { cart, setCart } = useContext(cartContext);

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
    toast.success("Removed from cart!");
  };

  const handleIncreaseQuantity = (id) => {
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    setCart(updatedCart);
    toast.success("Quantity increased!");
  };

  const handleDecreaseQuantity = (id) => {
    const updatedCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity - 1) }
        : item
    );
    setCart(updatedCart);
    toast.success("Quantity decreased!");
  };

  const handleRemoveItem = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);
    toast.success("Item removed from cart!");
  };

  return (
    <>
      <div className="cart">
        <div className="cart-header">
          <div className="cart-title-section">
            <ShoppingCart className="cart-icon" size={28} />
            <h2 className="cart-title">Shopping Cart</h2>
          </div>
          <div className="cart-stats">
            <span className="item-count">{cart.length} items</span>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <Package className="empty-icon" size={64} />
            <h3>Your cart is empty</h3>
            <p>Add some products to get started!</p>
            <Link to="/" className="continue-shopping-btn">
              <ArrowLeft size={20} />
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <Link
                    to={`/productPage/productId:${item.id}`}
                    className="cart-item-link"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="cart-image"
                    />
                    <div className="cart-details">
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-price">${item.price}</p>
                      {item.profit && (
                        <p className="item-profit">Profit: ${item.profit}</p>
                      )}
                    </div>
                  </Link>

                  <div className="quantity-controls">
                    <button
                      className="quantity-btn decrease"
                      onClick={() => handleDecreaseQuantity(item.id)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      className="quantity-btn increase"
                      onClick={() => handleIncreaseQuantity(item.id)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="item-total">
                    <span className="total-price">
                      ${item.price * item.quantity}
                    </span>
                  </div>

                  <button
                    className="remove-item-btn"
                    onClick={() => handleRemoveItem(item.id)}
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="summary-row total-row">
                  <span>Total:</span>
                  <span className="total-amount">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="cart-actions">
                <button
                  className="clear-cart-btn"
                  onClick={() => {
                    setCart([]);
                    toast.success("Your cart is now empty!");
                  }}
                >
                  <Trash2 size={18} />
                  Clear Cart
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <CheckOut />
    </>
  );
}
