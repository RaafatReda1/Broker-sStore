import { useState, useContext } from "react";
import "./Header.css";
import DropMenu from "../DropMenu/DropMenu";
import {
  currentPageContext,
  userContext,
  userDataContext,
} from "../../AppContexts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTie } from "@fortawesome/free-solid-svg-icons";

const Header = () => {
  const { setcurrentPage } = useContext(currentPageContext);
  const { user } = useContext(userContext);
  const { userData } = useContext(userDataContext);

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
          {/* Avatar / Icon as dropdown toggle */}
          <div
            className="profile-trigger"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            {userData?.avatar_url ? (
              <img
                src={userData.avatar_url}
                alt="Profile"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%", // make it circular
                  cursor: "pointer",
                }}
              />
            ) : (
              <FontAwesomeIcon
                icon={faUserTie}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%", // make it circular
                  border: "solid 2px white",
                  padding: "5px",
                  cursor: "pointer",
                }}
              />
            )}
          </div>

          {/* Dropdown */}
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
