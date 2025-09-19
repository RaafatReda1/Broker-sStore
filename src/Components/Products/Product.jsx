import { useContext } from "react";
import "./Product.css";
import {
  currentPageContext,
  cartContext,
  currentProductContext,
  userContext,
} from "../../AppContexts";

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
  const { setcurrentPage } = useContext(currentPageContext);
  const { cart, setCart } = useContext(cartContext);
  const { setCurrentProduct } = useContext(
    currentProductContext
  );
  const { user } = useContext(userContext);

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
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  return (
    <div className="card">
      <img
        src={src}
        alt=""
        onClick={() => {
          setcurrentPage("productPage");
          setCurrentProduct({
            id,
            name,
            description,
            price,
            image: src,
            images,
            fullDescription,
            profit,
            quantity: 1,
          });
        }}
      />
      <h3>{name}</h3>
      <h5>{description}</h5>
      <h5 className="price">{price}$</h5>

      <div className="productBtns">
        {user.authority !== "broker" && (
          <button type="button" onClick={handleAddToCart}>
            Add to cart
          </button>
        )}
        {user.authority === "broker" && (
          <button
            type="button"
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
        )}
      </div>
    </div>
  );
};

export default Product;
