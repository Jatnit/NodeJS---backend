const inventoryClient = (() => {
  if (window.axios) {
    return {
      get: (url) => window.axios.get(url),
    };
  }
  const request = async (url) => {
    const response = await fetch(url, {
      credentials: "same-origin",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Request failed");
    }
    return { data: payload };
  };
  return {
    get: (url) => request(url),
  };
})();

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value) || 0);

const InventoryPage = () => {
  const { useEffect, useState } = React;
  const [inventory, setInventory] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [inventoryRes, bestSellerRes] = await Promise.all([
        inventoryClient.get("/api/inventory"),
        inventoryClient.get("/api/inventory/best-sellers"),
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

  const highlightClass = (quantity) => {
    if (quantity < 10) {
      return "text-danger fw-semibold";
    }
    if (quantity > 50) {
      return "text-success fw-semibold";
    }
    return "";
  };

  const topCards = bestSellers.slice(0, 3);

  return (
    <div className="p-4">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        {topCards.length === 0 && !loading && (
          <div className="col-12">
            <div className="alert alert-light border-dashed text-muted mb-0">
              Chưa có dữ liệu bán chạy.
            </div>
          </div>
        )}
        {topCards.map((product, index) => (
          <div className="col-md-4" key={product.id}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="badge bg-dark-subtle text-dark fw-semibold rounded-pill px-3 py-2">
                    Top {index + 1}
                  </div>
                  <span className="text-muted small">
                    {product.totalSold || 0} lượt bán
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="rounded"
                      style={{ width: "72px", height: "72px", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="bg-light rounded"
                      style={{ width: "72px", height: "72px" }}
                    />
                  )}
                  <div>
                    <h5 className="mb-1">{product.name}</h5>
                    <p className="text-muted mb-0">
                      Tổng bán: {product.totalSold || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Tồn kho chi tiết</h5>
        <button className="btn btn-outline-dark btn-sm" onClick={fetchData}>
          Làm mới
        </button>
      </div>

      <div className="table-responsive shadow-sm rounded-3 bg-white">
        <table className="table align-middle mb-0">
          <thead className="table-light text-uppercase small text-muted">
            <tr>
              <th>Ảnh</th>
              <th>Sản phẩm</th>
              <th>Biến thể</th>
              <th className="text-end">Tồn kho</th>
              <th className="text-end">Đã bán</th>
              <th className="text-end">Giá</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading && inventory.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  Không có dữ liệu tồn kho.
                </td>
              </tr>
            )}
            {!loading &&
              inventory.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.productName}
                        className="rounded"
                        style={{ width: "56px", height: "56px", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="bg-light rounded" style={{ width: "56px", height: "56px" }} />
                    )}
                  </td>
                  <td>
                    <div className="fw-semibold">{item.productName}</div>
                    <small className="text-muted">SKU #{item.id}</small>
                  </td>
                  <td>
                    Màu {item.color || "—"} / Size {item.size || "—"}
                  </td>
                  <td className={`text-end ${highlightClass(Number(item.stockQuantity) || 0)}`}>
                    {item.stockQuantity}
                  </td>
                  <td className="text-end">{item.totalSold || 0}</td>
                  <td className="text-end">{formatCurrency(item.price)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const mountAdminInventory = () => {
  const container = document.getElementById("admin-inventory-root");
  if (!container || !window.React || !window.ReactDOM) {
    return;
  }
  const root = ReactDOM.createRoot(container);
  root.render(<InventoryPage />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAdminInventory);
} else {
  mountAdminInventory();
}


