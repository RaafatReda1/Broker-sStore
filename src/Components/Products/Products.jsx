import React, { useContext } from "react";
import Product from "./Product";
import "./Products.css";

import { productsContext, staffContext } from "../../AppContexts";

const Products = () => {
  const { products } = useContext(productsContext);
  const { isAdmin, isModerator } = useContext(staffContext);

  return (
    <div className="productsContainer">
      {/* Products Header */}
      <div className="products-header">
        <h1 className="products-title">Our Products</h1>
        <p className="products-subtitle">
          Discover amazing products at great prices
        </p>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="products-empty">
          <div className="products-empty-icon">📦</div>
          <h3 className="products-empty-title">No Products Available</h3>
          <p className="products-empty-subtitle">
            Check back later for new products!
          </p>
        </div>
      ) : (
        products.map((item) => {
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
              discount={item.discount || 0}
              isNew={item.isNew || false}
              isFeatured={item.isFeatured || false}
            />
          );
        })
      )}
    </div>
  );
};

export default Products;
