import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserTie,
  faShoppingCart,
  faMoneyBillWave,
  faBell,
  faWallet,
  faBoxOpen,
  faSearch,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

import { userDataContext, productsContext } from "../../AppContexts";
import DropMenu from "../DropMenu/DropMenu";
import "./Header.css";

const SEARCH_RESULTS_LIMIT = 5;
const SCROLL_THRESHOLD = 20;
const NOTIFICATION_COUNT = 3;

const Header = () => {
  const { userData } = useContext(userDataContext);
  const { products } = useContext(productsContext);
  const navigate = useNavigate();

  // State management
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setShowSearchResults(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isSearchOpen]);

  // Handle search functionality
  useEffect(() => {
    if (searchQuery.trim() && products.length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.name?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
      );
      setSearchResults(filtered.slice(0, SEARCH_RESULTS_LIMIT));
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, products]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [navigate]);

  // Handlers
  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const trimmedQuery = searchQuery.trim();

      if (trimmedQuery) {
        navigate(`/?search=${encodeURIComponent(trimmedQuery)}`);
        setIsSearchOpen(false);
        setSearchQuery("");
        setShowSearchResults(false);
      }
    },
    [searchQuery, navigate]
  );

  const handleSearchResultClick = useCallback(
    (productId) => {
      navigate(`/productPage/productId:${productId}`);
      setIsSearchOpen(false);
      setSearchQuery("");
      setShowSearchResults(false);
      setIsMobileMenuOpen(false);
    },
    [navigate]
  );

  const handleSearchInputChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
    if (isSearchOpen) {
      setSearchQuery("");
      setShowSearchResults(false);
    }
  }, [isSearchOpen]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  return (
    <header className={scrolled ? "scrolled" : ""}>
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <h2>
            <Link to="/" aria-label="Cicada Home">
              Cicada
            </Link>
          </h2>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main navigation">
          {!userData && (
            <Link to="/cart" className="nav-link" aria-label="Shopping cart">
              <FontAwesomeIcon icon={faShoppingCart} aria-hidden="true" />
              <span>Cart</span>
            </Link>
          )}

          {userData && (
            <>
              <Link to="/withdraw" className="nav-link" aria-label="Withdraw funds">
                <FontAwesomeIcon icon={faMoneyBillWave} aria-hidden="true" />
                <span>Withdraw</span>
              </Link>

              <Link to="/notifications" className="nav-link" aria-label={`Notifications (${NOTIFICATION_COUNT} unread)`}>
                <FontAwesomeIcon icon={faBell} aria-hidden="true" />
                <span>Notifications</span>
                {NOTIFICATION_COUNT > 0 && (
                  <span className="notification-badge" aria-label={`${NOTIFICATION_COUNT} unread notifications`}>
                    {NOTIFICATION_COUNT}
                  </span>
                )}
              </Link>

              <Link to="/balance" className="nav-link" aria-label="Account balance">
                <FontAwesomeIcon icon={faWallet} aria-hidden="true" />
                <span>Balance</span>
              </Link>
            </>
          )}

          <Link to="/" className="nav-link" aria-label="Browse products">
            <FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" />
            <span>Products</span>
          </Link>

          {/* Search Bar */}
          <div
            className={`search-container ${isSearchOpen ? "open" : ""}`}
            ref={searchRef}
          >
            <button
              className="search-toggle"
              onClick={toggleSearch}
              aria-label="Toggle search"
              aria-expanded={isSearchOpen}
            >
              <FontAwesomeIcon icon={faSearch} aria-hidden="true" />
            </button>

            {isSearchOpen && (
              <div className="search-form-wrapper">
                <form onSubmit={handleSearch} className="search-form" role="search">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    autoFocus
                    aria-label="Search products"
                    style={{ width: "90%" }}
                  />
                </form>

                {showSearchResults && searchResults.length > 0 && (
                  <div className="search-results" role="listbox">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="search-result-item"
                        onClick={() => handleSearchResultClick(product.id)}
                        role="option"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleSearchResultClick(product.id);
                          }
                        }}
                      >
                        <img
                          src={product.images?.[0]}
                          alt={product.name}
                          loading="lazy"
                        />
                        <div className="search-result-info">
                          <h4>{product.name}</h4>
                          <p>{product.description}</p>
                          <span className="search-result-price">
                            ${product.price?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}

                    <div
                      className="search-view-all"
                      onClick={handleSearch}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleSearch(e);
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faSearch} aria-hidden="true" />
                      View all results for "{searchQuery}"
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="profile-container">
            <div
              className="profile-trigger"
              onClick={toggleDropdown}
              role="button"
              tabIndex={0}
              aria-label="User menu"
              aria-expanded={isDropdownOpen}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  toggleDropdown();
                }
              }}
            >
              {userData?.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt={`${userData.name || "User"}'s avatar`}
                  className="profile-avatar"
                  loading="lazy"
                />
              ) : (
                <div className="profile-icon">
                  <FontAwesomeIcon icon={faUserTie} aria-hidden="true" />
                </div>
              )}
              {userData && (
                <span className="user-name">{userData.name || "User"}</span>
              )}
            </div>
            <DropMenu isOpen={isDropdownOpen} onClose={closeDropdown} />
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          <FontAwesomeIcon
            icon={isMobileMenuOpen ? faTimes : faBars}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav
        className={`mobile-nav ${isMobileMenuOpen ? "open" : ""}`}
        aria-label="Mobile navigation"
      >
        <div className="mobile-search">
          <form onSubmit={handleSearch} role="search">
            <FontAwesomeIcon icon={faSearch} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              aria-label="Search products"
            />
          </form>
        </div>

        {!userData && (
          <Link
            to="/cart"
            className="mobile-nav-link"
            onClick={closeMobileMenu}
            aria-label="Shopping cart"
          >
            <FontAwesomeIcon icon={faShoppingCart} aria-hidden="true" />
            <span>Cart</span>
          </Link>
        )}

        {userData && (
          <>
            <Link
              to="/withdraw"
              className="mobile-nav-link"
              onClick={closeMobileMenu}
              aria-label="Withdraw funds"
            >
              <FontAwesomeIcon icon={faMoneyBillWave} aria-hidden="true" />
              <span>Withdraw</span>
            </Link>

            <Link
              to="/notifications"
              className="mobile-nav-link"
              onClick={closeMobileMenu}
              aria-label={`Notifications (${NOTIFICATION_COUNT} unread)`}
            >
              <FontAwesomeIcon icon={faBell} aria-hidden="true" />
              <span>Notifications</span>
              {NOTIFICATION_COUNT > 0 && (
                <span className="notification-badge" aria-label={`${NOTIFICATION_COUNT} unread notifications`}>
                  {NOTIFICATION_COUNT}
                </span>
              )}
            </Link>

            <Link
              to="/balance"
              className="mobile-nav-link"
              onClick={closeMobileMenu}
              aria-label="Account balance"
            >
              <FontAwesomeIcon icon={faWallet} aria-hidden="true" />
              <span>Balance</span>
            </Link>
          </>
        )}

        <Link
          to="/"
          className="mobile-nav-link"
          onClick={closeMobileMenu}
          aria-label="Browse products"
        >
          <FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" />
          <span>Products</span>
        </Link>
      </nav>
    </header>
  );
};

export default Header;