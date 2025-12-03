const { useEffect, useState } = React;

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const StockBadge = ({ quantity }) => {
  const qty = Number(quantity) || 0;
  if (qty === 0) {
    return (
      <span className="badge fw-semibold" style={{ background: "#fee2e2", color: "#991b1b", padding: "6px 12px", borderRadius: "20px" }}>
        Hết hàng
      </span>
    );
  }
  if (qty < 10) {
    return (
      <span className="badge fw-semibold" style={{ background: "#fef3c7", color: "#92400e", padding: "6px 12px", borderRadius: "20px" }}>
        {qty} sản phẩm
      </span>
    );
  }
  if (qty > 50) {
    return (
      <span className="badge fw-semibold" style={{ background: "#d1fae5", color: "#065f46", padding: "6px 12px", borderRadius: "20px" }}>
        {qty} sản phẩm
      </span>
    );
  }
  return (
    <span className="badge fw-semibold" style={{ background: "#dbeafe", color: "#1e40af", padding: "6px 12px", borderRadius: "20px" }}>
      {qty} sản phẩm
    </span>
  );
};

const TopSellerCard = ({ product, rank }) => {
  const rankColors = {
    1: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
    2: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
    3: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
  };

  return (
    <div className="col-md-4">
      <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "16px" }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div
              className="d-flex align-items-center justify-content-center text-white fw-bold"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: rankColors[rank] || "#6b7280",
                fontSize: "14px",
              }}
            >
              #{rank}
            </div>
            <div className="d-flex align-items-center gap-1 text-muted small">
              <i className="bi bi-bag-check"></i>
              <span>{product.totalSold || 0} đã bán</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {product.thumbnailUrl ? (
              <img
                src={product.thumbnailUrl}
                alt={product.name}
                className="rounded"
                style={{ width: "64px", height: "64px", objectFit: "cover" }}
              />
            ) : (
              <div
                className="rounded d-flex align-items-center justify-content-center"
                style={{ width: "64px", height: "64px", background: "#f3f4f6" }}
              >
                <i className="bi bi-image text-muted" style={{ fontSize: "24px" }}></i>
              </div>
            )}
            <div>
              <h6 className="fw-bold mb-1">{product.name}</h6>
              <small className="text-muted">ID: #{product.id}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [inventoryRes, bestSellerRes] = await Promise.all([
        axios.get("/api/inventory"),
        axios.get("/api/inventory/best-sellers"),
      ]);
      setInventory(inventoryRes.data?.data || []);
      setBestSellers(bestSellerRes.data?.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu kho.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const topSellers = bestSellers.slice(0, 3);
  const totalStock = inventory.reduce((sum, item) => sum + (Number(item.stockQuantity) || 0), 0);
  const lowStock = inventory.filter((item) => (Number(item.stockQuantity) || 0) < 10).length;

  return (
    <div className="pb-4">
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2" style={{ borderRadius: "12px" }}>
          <i className="bi bi-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "16px" }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small text-uppercase mb-1 fw-semibold" style={{ letterSpacing: "0.05em" }}>
                    Tổng tồn kho
                  </p>
                  {loading ? (
                    <div className="placeholder-glow"><span className="placeholder col-6" style={{ height: "32px" }}></span></div>
                  ) : (
                    <h3 className="fw-bold mb-0">{totalStock.toLocaleString("vi-VN")}</h3>
                  )}
                </div>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
                >
                  <i className="bi bi-boxes text-white" style={{ fontSize: "24px" }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "16px" }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small text-uppercase mb-1 fw-semibold" style={{ letterSpacing: "0.05em" }}>
                    Biến thể
                  </p>
                  {loading ? (
                    <div className="placeholder-glow"><span className="placeholder col-6" style={{ height: "32px" }}></span></div>
                  ) : (
                    <h3 className="fw-bold mb-0">{inventory.length.toLocaleString("vi-VN")}</h3>
                  )}
                </div>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" }}
                >
                  <i className="bi bi-grid-3x3 text-white" style={{ fontSize: "24px" }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "16px" }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small text-uppercase mb-1 fw-semibold" style={{ letterSpacing: "0.05em" }}>
                    Sắp hết hàng
                  </p>
                  {loading ? (
                    <div className="placeholder-glow"><span className="placeholder col-6" style={{ height: "32px" }}></span></div>
                  ) : (
                    <h3 className="fw-bold mb-0" style={{ color: lowStock > 0 ? "#dc2626" : "#16a34a" }}>{lowStock}</h3>
                  )}
                </div>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{ width: "56px", height: "56px", borderRadius: "14px", background: lowStock > 0 ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                >
                  <i className={`bi ${lowStock > 0 ? "bi-exclamation-triangle" : "bi-check-circle"} text-white`} style={{ fontSize: "24px" }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Sellers */}
      {topSellers.length > 0 && (
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-trophy text-warning" style={{ fontSize: "20px" }}></i>
            <h5 className="fw-bold mb-0">Sản phẩm bán chạy</h5>
          </div>
          <div className="row g-4">
            {topSellers.map((product, index) => (
              <TopSellerCard key={product.id} product={product} rank={index + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "16px" }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h5 className="fw-bold mb-1">Chi tiết tồn kho</h5>
              <p className="text-muted small mb-0">Danh sách tất cả biến thể sản phẩm</p>
            </div>
            <button
              className="btn btn-outline-dark btn-sm"
              style={{ borderRadius: "10px" }}
              onClick={fetchData}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Làm mới
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="text-muted small text-uppercase" style={{ letterSpacing: "0.05em" }}>
                  <th className="border-0 py-3">Sản phẩm</th>
                  <th className="border-0 py-3">Biến thể</th>
                  <th className="border-0 py-3">Tồn kho</th>
                  <th className="border-0 py-3 text-end">Đã bán</th>
                  <th className="border-0 py-3 text-end">Giá</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <div className="spinner-border text-dark" role="status"></div>
                      <p className="mt-2 mb-0 text-muted">Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                )}
                {!loading && inventory.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox" style={{ fontSize: "48px" }}></i>
                      <p className="mt-2 mb-0">Chưa có dữ liệu tồn kho</p>
                    </td>
                  </tr>
                )}
                {!loading &&
                  inventory.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-3">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.productName}
                              className="rounded"
                              style={{ width: "48px", height: "48px", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              className="rounded d-flex align-items-center justify-content-center"
                              style={{ width: "48px", height: "48px", background: "#f3f4f6" }}
                            >
                              <i className="bi bi-image text-muted"></i>
                            </div>
                          )}
                          <div>
                            <div className="fw-semibold">{item.productName}</div>
                            <small className="text-muted">SKU #{item.id}</small>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="badge bg-light text-dark" style={{ borderRadius: "8px", padding: "6px 10px" }}>
                          {item.color || "—"} / {item.size || "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        <StockBadge quantity={item.stockQuantity} />
                      </td>
                      <td className="py-3 text-end">
                        <span className="fw-semibold">{item.totalSold || 0}</span>
                      </td>
                      <td className="py-3 text-end fw-semibold">
                        {formatCurrency(item.price)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mount
const mountAdminInventory = () => {
  const container = document.getElementById("admin-inventory-root");
  if (!container || !window.React || !window.ReactDOM) return;
  const root = ReactDOM.createRoot(container);
  root.render(<InventoryPage />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAdminInventory);
} else {
  mountAdminInventory();
}
