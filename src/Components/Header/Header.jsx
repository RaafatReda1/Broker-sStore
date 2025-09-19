import { useState, useContext } from "react";
import "./Header.css";
import DropMenu from "../DropMenu/DropMenu";
import { currentPageContext, userContext } from "../../AppContexts";
const Header = () => {
  const { setcurrentPage } = useContext(currentPageContext);
  const { user } = useContext(userContext);

  // State for dropdown menu visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header>
      <div className="logo">
        <h2>
          <a href="/">Cicada</a>
        </h2>
      </div>

      <nav>
        {user.authority !== "broker" && (
          <h4 onClick={() => setcurrentPage("cart")}>Cart</h4>
        )}
        {user.authority === "broker" && (
          <h4 onClick={() => setcurrentPage("balance")}>Balance</h4>
        )}
        <h4 onClick={() => setcurrentPage("products")}>Products</h4>

        <div className="profile-container">
          <img
            src="/vite.svg"
            alt="Profile Photo"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
          <DropMenu
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
          />
        </div>
      </nav>
    </header>
  );
};

export default Header;
