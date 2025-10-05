import React, { useContext } from "react";
import Product from "./Product";
import "./Products.css";

import { productsContext, staffContext } from "../../AppContexts";

const Products = () => {
  const { products } = useContext(productsContext);
  const { isAdmin, isModerator } = useContext(staffContext);



  return (
    <div className="productsContainer">
     
      {products.map((item) => {
        return (
          <Product
            key={item.id}
            id={item.id}
            name={item.name}
            description={item.description}
            price={item.price}
            src={item.images[0]}
            images={item.images}
            fullDescription={item.fullDescription}
            profit={item.profit}
          ></Product>
        );
      })}
    </div>
  );
};

export default Products;
