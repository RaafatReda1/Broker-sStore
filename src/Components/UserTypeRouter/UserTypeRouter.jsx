import React, { useContext } from "react";
import { sessionContext, staffContext } from "../../AppContexts";
import Admin from "../Manage/Admin/Admin";
import Moderator from "../Manage/Moderator/Moderator";
import Products from "../Products/Products";

const UserTypeRouter = () => {
  const { session } = useContext(sessionContext);
  const { isAdmin, isModerator } = useContext(staffContext);


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
  return <Products />;
};

export default UserTypeRouter;
