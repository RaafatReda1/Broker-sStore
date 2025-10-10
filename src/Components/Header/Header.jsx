import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
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

import { userDataContext, productsContext, sessionContext } from "../../AppContexts";
import DropMenu from "../DropMenu/DropMenu";
import "./Header.css";
import supabase from "../../SupabaseClient";

const SEARCH_RESULTS_LIMIT = 5;
const SCROLL_THRESHOLD = 20;

const Header = () => {
  const { userData } = useContext(userDataContext);
  const { products } = useContext(productsContext);
  const { session } = useContext(sessionContext);
  const navigate = useNavigate();

  // State management
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [badgeAnimation, setBadgeAnimation] = useState("");

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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
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

  // Fetch notifications and calculate unread count
  useEffect(() => {
    if (!userData?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("Notifications")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching notifications:", error);
          return;
        }

        if (data) {
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    // Set up real-time subscription for notifications
    const notificationsSubscription = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notifications",
        },
        (payload) => {
          console.log("Header: Real-time notification update:", payload);

          if (payload.eventType === "INSERT") {
            console.log("Header: New notification inserted");
            setNotifications((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            console.log("Header: Notification updated", payload.new);
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? payload.new : n))
            );
          } else if (payload.eventType === "DELETE") {
            console.log("Header: Notification deleted");
            setNotifications((prev) =>
              prev.filter((n) => n.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Header: Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  }, [userData?.id]);

  // Calculate unread count with animation
  useEffect(() => {
    if (!userData?.id || notifications.length === 0) {
      const prevCount = unreadCount;
      setUnreadCount(0);
      if (prevCount > 0) {
        triggerBadgeAnimation();
      }
      return;
    }

    // Filter notifications based on user eligibility (same logic as ViewNotifications)
    const filteredNotifications = notifications.filter((notification) => {
      // If it's a broadcast to all users
      if (notification.isAll) {
        return true;
      }

      // If it's a direct email notification
      if (notification.brokerEmail && userData.email) {
        return notification.brokerEmail === userData.email;
      }

      // If it's a direct ID notification
      if (notification.brokerIdTo && userData.id) {
        return notification.brokerIdTo === userData.id;
      }

      // If it's a range notification
      if (notification.brokerIdFrom && notification.brokerIdTo && userData.id) {
        return (
          userData.id >= notification.brokerIdFrom &&
          userData.id <= notification.brokerIdTo
        );
      }

      return false;
    });

    // Count unread notifications
    const unreadNotifications = filteredNotifications.filter((notification) => {
      if (!notification.read_by) return true;
      return notification.read_by[userData.id] !== true;
    });

    const newCount = unreadNotifications.length;
    const prevCount = unreadCount;

    console.log("Header: Unread count calculation:", {
      totalNotifications: notifications.length,
      filteredNotifications: filteredNotifications.length,
      unreadNotifications: unreadNotifications.length,
      prevCount,
      newCount,
      userData: userData?.id,
    });

    setUnreadCount(newCount);

    // Trigger animation if count changed
    if (prevCount !== newCount) {
      console.log("Header: Count changed, triggering animation");
      triggerBadgeAnimation();
    }
  }, [notifications, userData?.id, userData?.email]);

  // Function to trigger badge animation
  const triggerBadgeAnimation = () => {
    setBadgeAnimation("count-change");
    setTimeout(() => {
      setBadgeAnimation("");
    }, 600);
  };

  // Manual refresh function for testing
  const refreshNotificationCount = async () => {
    if (!userData?.id) return;

    try {
      const { data, error } = await supabase
        .from("Notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error refreshing notifications:", error);
        return;
      }

      if (data) {
        console.log(
          "Header: Manual refresh - fetched notifications:",
          data.length
        );
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  };

  // Listen for custom events from ViewNotifications when messages are read
  useEffect(() => {
    const handleNotificationRead = (event) => {
      console.log("Header: Received notification read event:", event.detail);
      // Immediately refresh the notification count
      refreshNotificationCount();
    };

    // Listen for custom events
    window.addEventListener("notificationRead", handleNotificationRead);

    return () => {
      window.removeEventListener("notificationRead", handleNotificationRead);
    };
  }, [userData?.id]);

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
              <img src="./CicadaHorizentalWhite.png" style={{ width: "fit-content" , height: "110px", margin: "30px"}}></img>
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
          {session && (<Link
                to="/notifications"
                className="nav-link"
                aria-label={`Notifications (${unreadCount} unread)`}
                onClick={refreshNotificationCount}
              >
                <FontAwesomeIcon icon={faBell} aria-hidden="true" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span
                    className={`notification-badge ${badgeAnimation}`}
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>)}
          {userData && (
            <>
              <Link
                to="/withdraw"
                className="nav-link"
                aria-label="Withdraw funds"
              >
                <FontAwesomeIcon icon={faMoneyBillWave} aria-hidden="true" />
                <span>Withdraw</span>
              </Link>
              <Link
                to="/balance"
                className="nav-link"
                aria-label="Account balance"
              >
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
                <form
                  onSubmit={handleSearch}
                  className="search-form"
                  role="search"
                >
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
                      View all results for &quot;{searchQuery}&quot;
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
                  alt={`${
                    userData.fullName || userData.nickName || "User"
                  }'s avatar`}
                  className="profile-avatar"
                  loading="lazy"
                  onError={(e) => {
                    console.error(
                      "❌ Failed to load avatar image:",
                      userData.avatar_url
                    );
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : (
                <div className="profile-icon">
                  <FontAwesomeIcon icon={faUserTie} aria-hidden="true" />
                </div>
              )}
              {userData && (
                <span className="user-name">
                  {userData.fullName || userData.nickName || "User"}
                </span>
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
              onClick={() => {
                closeMobileMenu();
                refreshNotificationCount();
              }}
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <FontAwesomeIcon icon={faBell} aria-hidden="true" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span
                  className={`notification-badge ${badgeAnimation}`}
                  aria-label={`${unreadCount} unread notifications`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
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
