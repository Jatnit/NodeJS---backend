const { useEffect, useState } = React;

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

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setOrders(ordersRes.data?.data || []);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
                <div
                  className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                  style={{ background: "#f0fdf4", color: "#166534" }}
                >
                  <i className="bi bi-graph-up-arrow"></i>
                  <span className="small fw-semibold">Realtime</span>
                </div>
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
                  <h5 className="fw-bold mb-1">Đơn hàng gần đây</h5>
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
