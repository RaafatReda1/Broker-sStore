import supabase from "../SupabaseClient";

/**
 * Notification Service for Order Management
 * Handles sending notifications for order events
 */

export class NotificationService {
  /**
   * Send notification to a specific broker
   * @param {Object} options - Notification options
   * @param {number} options.brokerId - Target broker ID
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {boolean} options.isTemp - Whether notification is temporary
   * @returns {Promise<boolean>} - Success status
   */
  static async sendBrokerNotification({
    brokerId,
    title,
    message,
    isTemp = false,
  }) {
    try {
      // sendBrokerNotification called handled silently

      const notificationData = {
        title,
        msg: message,
        brokerIdTo: brokerId,
        isTemp,
        isAll: false,
        brokerIdFrom: null,
        brokerEmail: null,
      };

      // Inserting notification data handled silently

      const { data, error } = await supabase
        .from("Notifications")
        .insert(notificationData);

      if (error) {
        // Error sending broker notification handled silently
        return false;
      }

      // Broker notification sent successfully handled silently
      return true;
    } catch (error) {
      // Error in sendBrokerNotification handled silently
      return false;
    }
  }

  /**
   * Send notification to broker by email
   * @param {Object} options - Notification options
   * @param {string} options.email - Target broker email
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {boolean} options.isTemp - Whether notification is temporary
   * @returns {Promise<boolean>} - Success status
   */
  static async sendEmailNotification({
    email,
    title,
    message,
    isTemp = false,
  }) {
    try {
      const { data, error } = await supabase.from("Notifications").insert({
        title,
        msg: message,
        brokerEmail: email,
        isTemp,
        isAll: false,
        brokerIdFrom: null,
        brokerIdTo: null,
      });

      if (error) {
        // Error sending email notification handled silently
        return false;
      }

      // Email notification sent successfully handled silently
      return true;
    } catch (error) {
      // Error in sendEmailNotification handled silently
      return false;
    }
  }

  /**
   * Send new order notification to broker
   * @param {Object} order - Order object
   * @returns {Promise<boolean>} - Success status
   */
  static async notifyNewOrder(order) {
    // notifyNewOrder called handled silently

    const { brokerId, name, total, id, netProfit, status } = order;

    // Convert total and netProfit to numbers and validate
    const orderTotal = parseFloat(total) || 0;
    const orderProfit = parseFloat(netProfit) || 0;

    // Parsed values handled silently

    // Default status to false (pending) if not provided
    const orderStatus = status !== undefined ? status : false;
    const statusText = orderStatus ? "✅ Completed" : "⏳ Pending";
    const statusEmoji = orderStatus ? "🎉" : "⏰";

    const title = "🛒 New Order Placed Through Your assistance";
    const message =
      `**New Order #${id}**\n\n` +
      `👤 **Customer:** ${name}\n` +
      `💰 **Order Total:** $${orderTotal.toFixed(2)}\n` +
      `💵 **Your Profit:** $${orderProfit.toFixed(2)}\n` +
      `📊 **Status:** ${statusEmoji} ${statusText}\n` +
      `📅 **Date:** ${new Date().toLocaleDateString()}\n\n` +
      `🎯 **Order placed with your broker ID: ${brokerId}**\n\n`;

    // Sending notification to brokerId handled silently
    // Notification message handled silently

    return await this.sendBrokerNotification({
      brokerId,
      title,
      message,
      isTemp: false,
    });
  }

  /**
   * Send order status change notification
   * @param {Object} order - Order object
   * @param {boolean} newStatus - New order status
   * @returns {Promise<boolean>} - Success status
   */
  static async notifyOrderStatusChange(order, newStatus) {
    const { brokerId, name, id, total, netProfit } = order;

    // Convert total and netProfit to numbers and validate
    const orderTotal = parseFloat(total) || 0;
    const orderProfit = parseFloat(netProfit) || 0;

    const statusText = newStatus ? "✅ Completed" : "⏳ Pending";
    const statusEmoji = newStatus ? "🎉" : "⏰";
    const statusAction = newStatus
      ? "completed successfully"
      : "moved to pending status";

    const title = `${statusEmoji} Order Status Updated`;
    const message =
      `**Order #${id} Status Changed**\n\n` +
      `👤 **Customer:** ${name}\n` +
      `💰 **Order Total:** $${orderTotal.toFixed(2)}\n` +
      `💵 **Your Profit:** $${orderProfit.toFixed(2)}\n` +
      `📊 **New Status:** ${statusEmoji} ${statusText}\n` +
      `📅 **Updated:** ${new Date().toLocaleDateString()}\n\n` +
      `🎯 **Order placed with your broker ID: ${brokerId}**\n\n` +
      `Your order has been ${statusAction}. ` +
      `${
        newStatus
          ? "The profit has been added to your balance!"
          : "The order is now pending review."
      }`;

    return await this.sendBrokerNotification({
      brokerId,
      title,
      message,
      isTemp: false,
    });
  }

  /**
   * Send bulk order status change notification
   * @param {Array} orders - Array of order objects
   * @param {boolean} newStatus - New order status
   * @returns {Promise<boolean>} - Success status
   */
  static async notifyBulkOrderStatusChange(orders, newStatus) {
    if (!orders || orders.length === 0) return false;

    // Group orders by brokerId
    const ordersByBroker = orders.reduce((acc, order) => {
      if (!acc[order.brokerId]) {
        acc[order.brokerId] = [];
      }
      acc[order.brokerId].push(order);
      return acc;
    }, {});

    // Send notification to each broker
    const promises = Object.entries(ordersByBroker).map(
      async ([brokerId, brokerOrders]) => {
        const statusText = newStatus ? "✅ Completed" : "⏳ Pending";
        const statusEmoji = newStatus ? "🎉" : "⏰";
        const statusAction = newStatus
          ? "completed successfully"
          : "moved to pending status";

        // Calculate totals for this broker
        const totalOrderValue = brokerOrders.reduce(
          (sum, order) => sum + (parseFloat(order.total) || 0),
          0
        );
        const totalProfit = brokerOrders.reduce(
          (sum, order) => sum + (parseFloat(order.netProfit) || 0),
          0
        );

        const title = `${statusEmoji} Multiple Orders Status Updated`;
        const message =
          `**${brokerOrders.length} Orders Status Changed**\n\n` +
          `💰 **Total Order Value:** $${totalOrderValue.toFixed(2)}\n` +
          `💵 **Total Profit:** $${totalProfit.toFixed(2)}\n` +
          `📊 **New Status:** ${statusEmoji} ${statusText}\n` +
          `📅 **Updated:** ${new Date().toLocaleDateString()}\n\n` +
          `🎯 **Orders placed with your broker ID: ${brokerId}**\n\n` +
          `Order IDs: ${brokerOrders.map((o) => `#${o.id}`).join(", ")}\n\n` +
          `Your orders have been ${statusAction}. ` +
          `${
            newStatus
              ? "The profits have been added to your balance!"
              : "The orders are now pending review."
          }\n\n` +
          `Please check your orders dashboard for more details.`;

        return await this.sendBrokerNotification({
          brokerId: parseInt(brokerId),
          title,
          message,
          isTemp: false,
        });
      }
    );

    const results = await Promise.all(promises);
    return results.every((result) => result === true);
  }

  /**
   * Get broker information for notifications
   * @param {number} brokerId - Broker ID
   * @returns {Promise<Object|null>} - Broker information
   */
  static async getBrokerInfo(brokerId) {
    try {
      const { data, error } = await supabase
        .from("Brokers")
        .select("id, fullName, email, nickName")
        .eq("id", brokerId)
        .single();

      if (error) {
        // Error fetching broker info handled silently
        return null;
      }

      return data;
    } catch (error) {
      // Error in getBrokerInfo handled silently
      return null;
    }
  }

  /**
   * Send notification with fallback (try brokerId first, then email)
   * @param {Object} options - Notification options
   * @param {number} options.brokerId - Target broker ID
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {boolean} options.isTemp - Whether notification is temporary
   * @returns {Promise<boolean>} - Success status
   */
  static async sendNotificationWithFallback({
    brokerId,
    title,
    message,
    isTemp = false,
  }) {
    // First try to get broker info
    const brokerInfo = await this.getBrokerInfo(brokerId);

    if (brokerInfo && brokerInfo.email) {
      // Try email notification first
      const emailSuccess = await this.sendEmailNotification({
        email: brokerInfo.email,
        title,
        message,
        isTemp,
      });

      if (emailSuccess) return true;
    }

    // Fallback to brokerId notification
    return await this.sendBrokerNotification({
      brokerId,
      title,
      message,
      isTemp,
    });
  }

  /**
   * Send order deletion notification to broker
   * @param {Object} order - Order object
   * @param {string} staffComment - Optional staff comment about deletion
   * @returns {Promise<boolean>} - Success status
   */
  static async notifyOrderDeletion(order, staffComment = "") {
    const { brokerId, name, id, total, netProfit } = order;

    // Convert total and netProfit to numbers and validate
    const orderTotal = parseFloat(total) || 0;
    const orderProfit = parseFloat(netProfit) || 0;

    const title = "🗑️ Order Deleted";
    const message =
      `**Order #${id} Has Been Deleted**\n\n` +
      `👤 **Customer:** ${name}\n` +
      `💰 **Order Total:** $${orderTotal.toFixed(2)}\n` +
      `💵 **Your Profit:** $${orderProfit.toFixed(2)}\n` +
      `📅 **Deleted On:** ${new Date().toLocaleDateString()}\n\n` +
      `🎯 **Order was placed with your broker ID: ${brokerId}**\n\n` +
      `${staffComment ? `📝 **Staff Comment:** ${staffComment}\n\n` : ""}` +
      `⚠️ **Note:** This order has been permanently removed from the system. ` +
      `Any pending profit from this order will not be added to your balance.`;

    // Sending order deletion notification handled silently

    return await this.sendBrokerNotification({
      brokerId,
      title,
      message,
      isTemp: false,
    });
  }

  /**
   * Send comprehensive order summary to broker
   * @param {Object} order - Order object with all details
   * @returns {Promise<boolean>} - Success status
   */
  static async sendOrderSummary(order) {
    const {
      brokerId,
      name,
      total,
      id,
      netProfit,
      status,
      phone,
      address,
      notes,
      cart = [],
    } = order;

    // Convert total and netProfit to numbers and validate
    const orderTotal = parseFloat(total) || 0;
    const orderProfit = parseFloat(netProfit) || 0;

    const statusText = status ? "✅ Completed" : "⏳ Pending";
    const statusEmoji = status ? "🎉" : "⏰";

    // Calculate cart summary
    const cartSummary = cart
      .map(
        (item) =>
          `• ${item.name} x${item.quantity} = $${(
            (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)
          ).toFixed(2)}`
      )
      .join("\n");

    const title = "📋 Order Summary";
    const message =
      `**Order #${id} - Complete Details**\n\n` +
      `👤 **Customer Information:**\n` +
      `   Name: ${name}\n` +
      `   Phone: ${phone || "Not provided"}\n` +
      `   Address: ${address || "Not provided"}\n\n` +
      `🛒 **Order Items:**\n${cartSummary}\n\n` +
      `💰 **Financial Summary:**\n` +
      `   Order Total: $${orderTotal.toFixed(2)}\n` +
      `   Your Profit: $${orderProfit.toFixed(2)}\n` +
      `   Profit Margin: ${
        orderTotal > 0 ? ((orderProfit / orderTotal) * 100).toFixed(1) : 0
      }%\n\n` +
      `📊 **Status:** ${statusEmoji} ${statusText}\n` +
      `📅 **Date:** ${new Date().toLocaleDateString()}\n\n` +
      `🎯 **Broker ID:** ${brokerId}\n\n` +
      `${notes ? `📝 **Notes:** ${notes}\n\n` : ""}` +
      `Please check your orders dashboard for more details.`;

    return await this.sendBrokerNotification({
      brokerId,
      title,
      message,
      isTemp: false,
    });
  }
}

export default NotificationService;
