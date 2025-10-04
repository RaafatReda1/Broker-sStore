import React from "react";
import { useNotification } from "../../Contexts/NotificationContext";

const NotificationTest = () => {
  const { showSuccess, showError, showWarning, showInfo, showLoading } =
    useNotification();

  return (
    <></>
  );
};

export default NotificationTest;
