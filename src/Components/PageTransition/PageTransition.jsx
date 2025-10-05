import React, { useEffect, useState } from "react";
import { useLocation, Routes } from "react-router-dom";
import "./PageTransition.css";

// eslint-disable-next-line react/prop-types
const PageTransition = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  const onTransitionEnd = () => {
    if (transitionStage === "fadeOut") {
      setTransitionStage("fadeIn");
      setDisplayLocation(location);
    }
  };

  return (
    <div
      className={`page-transition ${transitionStage}`}
      onTransitionEnd={onTransitionEnd}
    >
      <Routes location={displayLocation}>{children}</Routes>
    </div>
  );
};

export default PageTransition;
