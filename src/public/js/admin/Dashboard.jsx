const { useEffect, useState, useRef, useCallback } = React;

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============================================
// NEW ORDER NOTIFICATION TOAST
// ============================================
const NewOrderToast = ({ orders, onDismiss }) => {
  if (!orders || orders.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxHeight: "calc(100vh - 100px)",
        overflowY: "auto",
      }}
    >
      {orders.map((order) => (
        <div
          key={order.id}
          className="animate__animated animate__fadeInRight"
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            padding: "16px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(16, 185, 129, 0.4)",
            minWidth: "320px",
            maxWidth: "400px",
            cursor: "pointer",
            animation: "slideIn 0.3s ease-out",
          }}
          onClick={() => onDismiss(order.id)}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-bell-fill" style={{ fontSize: "20px" }}></i>
                <span className="fw-bold">🎉 Đơn hàng mới!</span>
              </div>
              <div className="small opacity-90">
                <div className="fw-semibold mb-1">Mã đơn: {order.code}</div>
                <div>Khách: {order.customerName}</div>
                <div className="mt-1 fw-bold">{formatCurrency(order.totalAmount)}</div>
              </div>
            </div>
            <button
              className="btn btn-link text-white p-0"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(order.id);
              }}
              style={{ opacity: 0.7 }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="mt-2 small opacity-75">
            <i className="bi bi-clock me-1"></i>
            {formatTime(order.orderDate)} - Nhấn để đóng
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// NOTIFICATION SOUND
// ============================================
const playNotificationSound = () => {
  try {
    // Create audio context for notification
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Pleasant notification sound
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.value = 0.3;

    oscillator.start();
    
    // Quick beep pattern
    setTimeout(() => {
      oscillator.frequency.value = 1000;
    }, 100);
    setTimeout(() => {
      oscillator.frequency.value = 1200;
    }, 200);
    setTimeout(() => {
      oscillator.stop();
    }, 300);
  } catch (e) {
    console.log("Audio not supported");
  }
};

const StatCard = ({ title, value, icon, color, loading }) => (
  <div className="col-md-4">
    <div
      className="card border-0 shadow-sm h-100"
      style={{ borderRadius: "16px", overflow: "hidden" }}
    >
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <p className="text-muted small text-uppercase mb-1 fw-semibold" style={{ letterSpacing: "0.05em" }}>
              {title}
            </p>
            {loading ? (
              <div className="placeholder-glow">
                <span className="placeholder col-8" style={{ height: "32px" }}></span>
              </div>
            ) : (
              <h3 className="fw-bold mb-0" style={{ fontSize: "1.75rem" }}>{value}</h3>
            )}
          </div>
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: color,
            }}
          >
            <i className={`bi ${icon} text-white`} style={{ fontSize: "24px" }}></i>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    "Hoàn thành": { bg: "#d1fae5", color: "#065f46" },
    "Đang xử lý": { bg: "#dbeafe", color: "#1e40af" },
    "Đang giao": { bg: "#e0f2fe", color: "#0369a1" },
    "Đã hủy": { bg: "#fee2e2", color: "#991b1b" },
    "Mới": { bg: "#fef3c7", color: "#92400e" },
  };
  const style = styles[status] || { bg: "#f3f4f6", color: "#374151" };
  
  return (
    <span
      className="badge fw-semibold"
      style={{
        background: style.bg,
        color: style.color,
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
      }}
    >
      {status}
    </span>
  );
};

const RevenueBar = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="d-flex align-items-end gap-2" style={{ height: "160px" }}>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-fill placeholder-glow">
            <span
              className="placeholder w-100"
              style={{ height: `${40 + Math.random() * 80}px`, borderRadius: "8px" }}
            ></span>
          </div>
        ))}
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="d-flex align-items-end gap-2" style={{ height: "160px" }}>
      {data.map((item, index) => {
        const height = Math.max((item.total / maxValue) * 140, 8);
        return (
          <div
            key={index}
            className="flex-fill d-flex flex-column align-items-center"
            style={{ minWidth: 0 }}
          >
            <div
              className="w-100 position-relative"
              style={{
                height: `${height}px`,
                background: "linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)",
                borderRadius: "8px",
                transition: "height 0.3s ease",
              }}
              title={formatCurrency(item.total)}
            >
              {item.total > 0 && (
                <div
                  className="position-absolute w-100 text-center text-white small fw-semibold"
                  style={{ top: "-22px", fontSize: "10px" }}
                >
                  {item.total >= 1000000
                    ? `${(item.total / 1000000).toFixed(1)}M`
                    : item.total >= 1000
                    ? `${(item.total / 1000).toFixed(0)}K`
                    : item.total}
                </div>
              )}
            </div>
            <span className="text-muted mt-2" style={{ fontSize: "11px" }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// LIVE INDICATOR
// ============================================
const LiveIndicator = ({ isLive, lastUpdate }) => (
  <div
    className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
    style={{ 
      background: isLive ? "#f0fdf4" : "#fef3c7", 
      color: isLive ? "#166534" : "#92400e" 
    }}
  >
    <span 
      style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: isLive ? "#22c55e" : "#f59e0b",
        animation: isLive ? "pulse 2s infinite" : "none",
      }}
    ></span>
    <span className="small fw-semibold">
      {isLive ? "LIVE" : "Đang kết nối..."} 
      {lastUpdate && <span className="opacity-75 ms-1">• {formatTime(lastUpdate)}</span>}
    </span>
  </div>
);

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newOrders, setNewOrders] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLive, setIsLive] = useState(true);
  
  // Store previous order IDs to detect new orders
  const previousOrderIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Fetch recent orders
  const fetchOrders = useCallback(async () => {
    try {
      const ordersRes = await axios.get("/api/orders/recent");
      const fetchedOrders = ordersRes.data?.data || [];
      
      // Get IDs of fetched orders
      const currentOrderIds = new Set(fetchedOrders.map(o => o.id));
      
      // Detect new orders (not in previous fetch)
      if (!isFirstLoadRef.current) {
        const newOrdersList = fetchedOrders.filter(
          order => !previousOrderIdsRef.current.has(order.id)
        );
        
        if (newOrdersList.length > 0) {
          // Play notification sound
          playNotificationSound();
          
          // Add to new orders notification
          setNewOrders(prev => [...newOrdersList, ...prev].slice(0, 5));
        }
      }
      
      // Update previous IDs
      previousOrderIdsRef.current = currentOrderIds;
      isFirstLoadRef.current = false;
      
      setOrders(fetchedOrders);
      setLastUpdate(new Date().toISOString());
      setIsLive(true);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setIsLive(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [summaryRes, ordersRes] = await Promise.all([
          axios.get("/api/dashboard/summary"),
          axios.get("/api/orders/recent"),
        ]);
        setSummary(summaryRes.data?.data || {});
        
        const fetchedOrders = ordersRes.data?.data || [];
        setOrders(fetchedOrders);
        
        // Initialize previous order IDs
        previousOrderIdsRef.current = new Set(fetchedOrders.map(o => o.id));
        isFirstLoadRef.current = false;
        
        setLastUpdate(new Date().toISOString());
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Poll for new orders every 3 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  // Dismiss notification
  const dismissNotification = useCallback((orderId) => {
    setNewOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const stats = [
    {
      title: "Tổng doanh thu",
      value: formatCurrency(summary?.totalRevenue || 0),
      icon: "bi-cash-stack",
      color: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    },
    {
      title: "Tổng đơn hàng",
      value: (summary?.totalOrders || 0).toLocaleString("vi-VN"),
      icon: "bi-bag-check",
      color: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    },
    {
      title: "Tổng sản phẩm",
      value: (summary?.totalProducts || 0).toLocaleString("vi-VN"),
      icon: "bi-box-seam",
      color: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
  ];

  return (
    <div className="pb-5">
      {/* New Order Notifications */}
      <NewOrderToast orders={newOrders} onDismiss={dismissNotification} />

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle"></i>
          {error}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-auto"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="row g-4 mb-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} loading={loading} />
        ))}
      </div>

      <div className="row g-4">
        {/* Revenue Chart */}
        <div className="col-lg-8">
          <div
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: "16px" }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h5 className="fw-bold mb-1">Doanh thu 7 ngày</h5>
                  <p className="text-muted small mb-0">
                    Tổng hợp từ các đơn hoàn thành
                  </p>
                </div>
                <LiveIndicator isLive={isLive} lastUpdate={lastUpdate} />
              </div>
              <RevenueBar data={summary?.recentRevenue || []} loading={loading} />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="col-lg-4">
          <div
            className="card border-0 shadow-sm h-100 text-white"
            style={{
              borderRadius: "16px",
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
            }}
          >
            <div className="card-body p-4 d-flex flex-column">
              <div className="mb-4">
                <p className="text-white-50 small text-uppercase mb-1" style={{ letterSpacing: "0.1em" }}>
                  Tổng quan tuần
                </p>
                <h5 className="fw-bold mb-0">Hiệu suất kinh doanh</h5>
              </div>
              
              <div className="flex-grow-1 d-flex flex-column justify-content-center gap-3">
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-white border-opacity-10">
                  <span className="text-white-50">Doanh thu tuần</span>
                  <span className="fw-bold">
                    {formatCurrency(
                      (summary?.recentRevenue || []).reduce((sum, d) => sum + (d.total || 0), 0)
                    )}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-white border-opacity-10">
                  <span className="text-white-50">Số đơn hàng</span>
                  <span className="fw-bold">{summary?.totalOrders || 0}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2">
                  <span className="text-white-50">Sản phẩm</span>
                  <span className="fw-bold">{summary?.totalProducts || 0}</span>
                </div>
              </div>

              <div
                className="mt-4 p-3 rounded-3"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <p className="small mb-1 fw-semibold">
                  <i className="bi bi-lightbulb me-2"></i>Gợi ý
                </p>
                <p className="small mb-0 text-white-50">
                  Theo dõi sát các đơn đang xử lý để tối ưu thời gian giao hàng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="row mt-4">
        <div className="col-12">
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "16px" }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h5 className="fw-bold mb-1">
                    Đơn hàng gần đây
                    <span 
                      className="badge bg-success ms-2" 
                      style={{ fontSize: "10px", verticalAlign: "middle" }}
                    >
                      Auto-refresh 3s
                    </span>
                  </h5>
                  <p className="text-muted small mb-0">8 đơn mới nhất</p>
                </div>
                <a
                  href="/admin/orders"
                  className="btn btn-dark btn-sm rounded-pill px-3"
                >
                  <i className="bi bi-arrow-right me-1"></i>
                  Xem tất cả
                </a>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-dark" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox" style={{ fontSize: "48px" }}></i>
                  <p className="mt-2 mb-0">Chưa có đơn hàng nào</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr className="text-muted small text-uppercase" style={{ letterSpacing: "0.05em" }}>
                        <th className="border-0 py-3">Mã đơn</th>
                        <th className="border-0 py-3">Khách hàng</th>
                        <th className="border-0 py-3">Ngày đặt</th>
                        <th className="border-0 py-3 text-end">Tổng tiền</th>
                        <th className="border-0 py-3 text-end">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="py-3">
                            <span className="fw-semibold">{order.code}</span>
                          </td>
                          <td className="py-3">{order.customerName}</td>
                          <td className="py-3 text-muted">
                            {formatDate(order.orderDate)}
                          </td>
                          <td className="py-3 text-end fw-semibold">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="py-3 text-end">
                            <StatusBadge status={order.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Mount
const mountAdminDashboard = () => {
  const container = document.getElementById("admin-dashboard-root");
  if (!container || !window.ReactDOM || !window.React) return;
  const root = ReactDOM.createRoot(container);
  root.render(<DashboardPage />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAdminDashboard);
} else {
  mountAdminDashboard();
}
