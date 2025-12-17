/**
 * Admin Order Notification System
 * Hiển thị popup thông báo đơn hàng mới ở tất cả trang Admin
 * Auto-refresh mỗi 3 giây
 */

(function() {
  'use strict';

  // Configuration
  const POLL_INTERVAL = 3000; // 3 seconds
  const MAX_NOTIFICATIONS = 5;
  const NOTIFICATION_DURATION = 10000; // 10 seconds auto-dismiss

  // State
  let previousOrderIds = new Set();
  let isFirstLoad = true;
  let notificationContainer = null;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  // Format time
  const formatTime = (dateStr) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.value = 0.3;

      oscillator.start();
      
      setTimeout(() => { oscillator.frequency.value = 1000; }, 100);
      setTimeout(() => { oscillator.frequency.value = 1200; }, 200);
      setTimeout(() => { oscillator.stop(); }, 300);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  // Create notification container
  const createContainer = () => {
    if (notificationContainer) return notificationContainer;

    notificationContainer = document.createElement('div');
    notificationContainer.id = 'order-notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      pointer-events: none;
    `;
    document.body.appendChild(notificationContainer);

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes orderSlideIn {
        from {
          transform: translateX(120%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes orderSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(120%);
          opacity: 0;
        }
      }
      .order-notification {
        animation: orderSlideIn 0.4s ease-out forwards;
        pointer-events: auto;
      }
      .order-notification.closing {
        animation: orderSlideOut 0.3s ease-in forwards;
      }
    `;
    document.head.appendChild(style);

    return notificationContainer;
  };

  // Show notification
  const showNotification = (order) => {
    const container = createContainer();
    
    const notification = document.createElement('div');
    notification.className = 'order-notification';
    notification.dataset.orderId = order.id;
    notification.style.cssText = `
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
      min-width: 320px;
      max-width: 400px;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: start; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 20px;">🔔</span>
            <span style="font-weight: bold;">🎉 Đơn hàng mới!</span>
          </div>
          <div style="font-size: 14px; opacity: 0.95;">
            <div style="font-weight: 600; margin-bottom: 4px;">Mã đơn: ${order.code}</div>
            <div>Khách: ${order.customerName}</div>
            <div style="margin-top: 4px; font-weight: bold; font-size: 16px;">${formatCurrency(order.totalAmount)}</div>
          </div>
        </div>
        <button 
          onclick="window.dismissOrderNotification('${order.id}')"
          style="background: none; border: none; color: white; opacity: 0.7; cursor: pointer; padding: 4px; font-size: 18px;"
        >×</button>
      </div>
      <div style="margin-top: 8px; font-size: 12px; opacity: 0.75;">
        🕐 ${formatTime(order.orderDate)} - Nhấn để xem chi tiết
      </div>
    `;

    notification.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        window.location.href = '/admin/orders';
      }
    });

    container.insertBefore(notification, container.firstChild);

    // Auto dismiss after duration
    setTimeout(() => {
      dismissNotification(order.id);
    }, NOTIFICATION_DURATION);

    // Limit notifications
    const notifications = container.querySelectorAll('.order-notification');
    if (notifications.length > MAX_NOTIFICATIONS) {
      const oldest = notifications[notifications.length - 1];
      oldest.remove();
    }
  };

  // Dismiss notification
  const dismissNotification = (orderId) => {
    const container = document.getElementById('order-notification-container');
    if (!container) return;

    const notification = container.querySelector(`[data-order-id="${orderId}"]`);
    if (notification) {
      notification.classList.add('closing');
      setTimeout(() => notification.remove(), 300);
    }
  };

  // Expose dismiss function globally
  window.dismissOrderNotification = dismissNotification;

  // Fetch orders and check for new ones
  const checkForNewOrders = async () => {
    try {
      const response = await fetch('/api/orders/recent');
      const data = await response.json();
      const orders = data?.data || [];

      if (!isFirstLoad) {
        const currentOrderIds = new Set(orders.map(o => o.id));
        
        // Find new orders
        orders.forEach(order => {
          if (!previousOrderIds.has(order.id)) {
            playNotificationSound();
            showNotification(order);
          }
        });

        previousOrderIds = currentOrderIds;
      } else {
        // First load - just store IDs
        previousOrderIds = new Set(orders.map(o => o.id));
        isFirstLoad = false;
      }
    } catch (err) {
      console.error('Order notification check failed:', err);
    }
  };

  // Initialize
  const init = () => {
    // Only run on admin pages
    if (!window.location.pathname.startsWith('/admin')) {
      return;
    }

    console.log('🔔 Order notification system initialized');
    
    // Initial check
    checkForNewOrders();
    
    // Start polling
    setInterval(checkForNewOrders, POLL_INTERVAL);
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
