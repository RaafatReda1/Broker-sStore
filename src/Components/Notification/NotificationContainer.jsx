import React from "react";
import { useNotification } from "../../Contexts/NotificationContext";
import Notification from "./Notification";

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  console.log(
    "NotificationContainer rendering with notifications:",
    notifications
  );

  return (
    <>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          show={true}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );
};

export default NotificationContainer;
