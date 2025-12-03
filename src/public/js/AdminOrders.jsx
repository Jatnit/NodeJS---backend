const STATUS_TABS = ["Mới", "Đang xử lý", "Hoàn thành", "Đã hủy"];

const apiClient = (() => {
  if (window.axios) {
    return {
      get: (url) => window.axios.get(url),
      post: (url, data) => window.axios.post(url, data),
      put: (url, data) => window.axios.put(url, data),
    };
  }
  const request = async (url, method = "GET", body) => {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Request failed");
    }
    return { data: payload };
  };
  return {
    get: (url) => request(url, "GET"),
    post: (url, data) => request(url, "POST", data),
    put: (url, data) => request(url, "PUT", data),
  };
})();

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value) || 0);

const OrdersPage = () => {
  const { useEffect, useState } = React;
  const [statusFilter, setStatusFilter] = useState("Mới");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [feedback, setFeedback] = useState("");

  const fetchOrders = async (status) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status) {
        params.set("status", status);
      }
      params.set("limit", "40");
      const response = await apiClient.get(`/api/orders?${params.toString()}`);
      setOrders(response.data?.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (orderId) => {
    setDetailLoading(true);
    try {
      const response = await apiClient.get(`/api/orders/${orderId}`);
      setSelectedOrder(response.data?.data || null);
    } catch (err) {
      setFeedback(err.message || "Không thể tải chi tiết đơn hàng.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      await apiClient.put(`/api/orders/${orderId}/status`, { status: nextStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order
        )
      );
      setFeedback("Đã cập nhật trạng thái đơn hàng.");
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: nextStatus });
      }
    } catch (err) {
      setFeedback(err.message || "Cập nhật trạng thái thất bại.");
    }
  };

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  const openDetail = (orderId) => {
    fetchDetail(orderId);
  };

  const closeDetail = () => setSelectedOrder(null);

  return (
    <div className="p-4">
      <div className="d-flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            type="button"
            className={`btn ${
              statusFilter === status ? "btn-dark" : "btn-outline-dark"
            } text-uppercase fw-semibold`}
            style={{ letterSpacing: "0.2em" }}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="alert alert-info d-flex justify-content-between align-items-center">
          <span>{feedback}</span>
          <button
            type="button"
            className="btn-close"
            onClick={() => setFeedback("")}
          />
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive shadow-sm rounded-3 bg-white">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light text-uppercase small text-muted">
            <tr>
              <th>ID</th>
              <th>Khách hàng</th>
              <th>Ngày tạo</th>
              <th className="text-end">Tổng tiền</th>
              <th style={{ width: "170px" }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  Không có đơn hàng trong trạng thái này.
                </td>
              </tr>
            )}
            {!loading &&
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="table-row-link"
                  role="button"
                  onClick={() => openDetail(order.id)}
                >
                  <td className="fw-semibold">{order.code}</td>
                  <td>{order.shippingName || order.user?.fullName || "Khách lẻ"}</td>
                  <td>
                    {order.orderDate
                      ? new Date(order.orderDate).toLocaleString("vi-VN")
                      : "--"}
                  </td>
                  <td className="text-end fw-semibold">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <select
                      className="form-select form-select-sm"
                      value={order.status}
                      onChange={(event) =>
                        handleStatusChange(order.id, event.target.value)
                      }
                    >
                      {STATUS_TABS.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="modal-backdrop show" style={{ display: "block" }}>
          <div
            className="modal d-block"
            tabIndex="-1"
            role="dialog"
            onClick={closeDetail}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              role="document"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Chi tiết đơn {selectedOrder.code}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeDetail} />
                </div>
                <div className="modal-body">
                  {detailLoading && (
                    <p className="text-muted mb-0">Đang tải chi tiết...</p>
                  )}
                  {!detailLoading && (
                    <>
                      <div className="mb-3">
                        <strong>Khách hàng:</strong>{" "}
                        {selectedOrder.shippingName ||
                          selectedOrder.user?.fullName ||
                          "Khách lẻ"}
                      </div>
                      <div className="mb-3">
                        <strong>Địa chỉ:</strong>{" "}
                        {selectedOrder.shippingAddress || "Không có"}
                      </div>
                      <div className="table-responsive">
                        <table className="table table-bordered align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Sản phẩm</th>
                              <th>Phiên bản</th>
                              <th>Số lượng</th>
                              <th className="text-end">Giá</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedOrder.items || []).map((item) => (
                              <tr key={item.id}>
                                <td>
                                  <div className="d-flex align-items-center gap-3">
                                    {item.productImage ? (
                                      <img
                                        src={item.productImage}
                                        alt={item.productName}
                                        style={{
                                          width: "56px",
                                          height: "56px",
                                          objectFit: "cover",
                                          borderRadius: "8px",
                                        }}
                                      />
                                    ) : (
                                      <div
                                        className="bg-light rounded"
                                        style={{ width: "56px", height: "56px" }}
                                      />
                                    )}
                                    <div>
                                      <div className="fw-semibold">
                                        {item.productName}
                                      </div>
                                      <small className="text-muted">
                                        SKU #{item.skuId}
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  {item.color || "—"} / {item.size || "—"}
                                </td>
                                <td>{item.quantity}</td>
                                <td className="text-end">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeDetail}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const mountAdminOrders = () => {
  const container = document.getElementById("admin-orders-root");
  if (!container || !window.React || !window.ReactDOM) {
    return;
  }
  const root = ReactDOM.createRoot(container);
  root.render(<OrdersPage />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAdminOrders);
} else {
  mountAdminOrders();
}


