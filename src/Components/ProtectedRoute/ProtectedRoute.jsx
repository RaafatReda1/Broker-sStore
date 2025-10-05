/* eslint-disable react/prop-types */
import React, { useContext } from "react";
import {
  sessionContext,
  userDataContext,
  staffContext,
} from "../../AppContexts";
import AccessDenied from "../AccessDenied/AccessDenied";

const ProtectedRoute = ({
  children,
  requireSession,
  blockBroker,
  requireAdmin,
  requireModerator,
  fallback,
}) => {
  const { session } = useContext(sessionContext);
  const { userData } = useContext(userDataContext);
  const { isAdmin, isModerator } = useContext(staffContext);

  // Debug logging for user roles
  if (requireAdmin || requireModerator) {
    console.log("🔍 ProtectedRoute Debug:", {
      isAdmin,
      isModerator,
      requireAdmin,
      requireModerator,
      session: session ? "Active" : "None",
      userData: userData
        ? { email: userData.email, authority: userData.authority }
        : null,
    });
  }

  // CRITICAL: Require session for admin access - check this FIRST
  if (requireAdmin && !session) {
    return (
      <AccessDenied
        message="You need to be signed in to access this page. Please sign in to continue."
        redirectTo="/signin"
        redirectText="Go to Sign In"
      />
    );
  }

  // Show loading state while user data is being fetched for admin routes
  if (requireAdmin && session && !userData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          fontSize: "18px",
          color: "#666",
        }}
      >
        🔄 Loading user permissions...
      </div>
    );
  }

  // For moderator routes, only require session if we're not in a fallback chain
  // (i.e., if this is a direct moderator route, not a fallback from admin)
  if (requireModerator && !requireAdmin && !session) {
    return (
      <AccessDenied
        message="You need to be signed in to access this page. Please sign in to continue."
        redirectTo="/signin"
        redirectText="Go to Sign In"
      />
    );
  }

  // Show loading state for direct moderator routes (not fallbacks)
  if (requireModerator && !requireAdmin && session && !userData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          fontSize: "18px",
          color: "#666",
        }}
      >
        🔄 Loading user permissions...
      </div>
    );
  }

  // Require admin access - show fallback if not admin (only if session exists)
  if (requireAdmin && !isAdmin) {
    return (
      fallback || (
        <AccessDenied
          message="Admin access required"
          redirectTo="/"
          redirectText="Go to Products"
        />
      )
    );
  }

  // Require moderator access - show fallback if not moderator (and not admin, only if session exists)
  if (requireModerator && !isModerator && !isAdmin) {
    return (
      fallback || (
        <AccessDenied
          message="Moderator access required"
          redirectTo="/"
          redirectText="Go to Products"
        />
      )
    );
  }

  // Require session for certain pages (like Balance) - check this first
  if (requireSession && !session) {
    return (
      <AccessDenied
        message="You need to be signed in to access this page. Please sign in to continue."
        redirectTo="/signin"
        redirectText="Go to Sign In"
      />
    );
  }

  // Block brokers from accessing certain pages (like Cart) - only if session exists
  if (blockBroker && session && userData) {
    return (
      <AccessDenied
        message="Brokers don't have access to this page. This feature is only available for customers."
        redirectTo="/"
        redirectText="Go to Products"
      />
    );
  }

  return children;
};

export default ProtectedRoute;
