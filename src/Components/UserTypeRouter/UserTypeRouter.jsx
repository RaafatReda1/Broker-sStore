import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import {
  sessionContext,
  staffContext,
  userDataContext,
} from "../../AppContexts";
import Admin from "../Manage/Admin/Admin";
import Moderator from "../Manage/Moderator/Moderator";
import Products from "../Products/Products";

const UserTypeRouter = () => {
  const { t } = useTranslation();
  const { session } = useContext(sessionContext);
  const { isAdmin, isModerator } = useContext(staffContext);
  const { userData } = useContext(userDataContext);

  // This should not happen anymore since we check data loading in App.jsx
  // But keeping as fallback
  if (
    session &&
    userData === null &&
    isAdmin === null &&
    isModerator === null
  ) {
    console.log("⏳ UserTypeRouter: Waiting for user data to load...");
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
        🔄 {t("userTypeRouter.loadingPermissions")}
      </div>
    );
  }

  // If user is admin, show admin dashboard
  if (isAdmin) {
    console.log("🔑 Showing Admin Dashboard");
    return <Admin />;
  }

  // If user is moderator, show moderator dashboard
  if (isModerator) {
    console.log("👮 Showing Moderator Dashboard");
    return <Moderator />;
  }

  // For all other cases (no session, normal users, etc.), show products
  console.log("🛍️ Showing Products for regular user");
  return <Products />;
};

export default UserTypeRouter;
