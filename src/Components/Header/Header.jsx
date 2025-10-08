/* eslint-disable react/react-in-jsx-scope */
import { useState, useContext } from "react";
import "./Header.css";
import DropMenu from "../DropMenu/DropMenu";
import { userDataContext } from "../../AppContexts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTie } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const Header = () => {
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
        {!userData && (
          <Link to="/cart">
            <h4>Cart</h4>
          </Link>
        )}
        {userData && (
          <>
            <Link to="/notifications">
              <h4>Notifications</h4>
            </Link>
            <Link to="/balance">
              <h4>Balance</h4>
            </Link>
          </>
        )}
        <Link to="/">
          <h4>Products</h4>
        </Link>
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
