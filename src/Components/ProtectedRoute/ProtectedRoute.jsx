import React, { useContext } from "react";
import { sessionContext, userDataContext } from "../../AppContexts";
import AccessDenied from "../AccessDenied/AccessDenied";

// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children, requireSession, blockBroker }) => {
  const { session } = useContext(sessionContext);
  const { userData } = useContext(userDataContext);

  // Block brokers from accessing certain pages (like Cart)
  if (blockBroker && userData) {
    return (
      <AccessDenied
        message="Brokers don't have access to this page. This feature is only available for customers."
        redirectTo="/"
        redirectText="Go to Products"
      />
    );
  }

  // Require session for certain pages (like Balance)
  if (requireSession && !session) {
    return (
      <AccessDenied
        message="You need to be signed in to access this page. Please sign in to continue."
        redirectTo="/signin"
        redirectText="Go to Sign In"
      />
    );
  }

  return children;
};

export default ProtectedRoute;
