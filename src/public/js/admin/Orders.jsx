const { useEffect, useState } = React;

const STATUS_TABS = ["Mới", "Đang xử lý", "Hoàn thành", "Đã hủy"];

const STATUS_STYLES = {
  "Mới": { bg: "#fef3c7", color: "#92400e" },
  "Đang xử lý": { bg: "#dbeafe", color: "#1e40af" },
  "Hoàn thành": { bg: "#d1fae5", color: "#065f46" },
  "Đã hủy": { bg: "#fee2e2", color: "#991b1b" },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString("vi-VN");
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || { bg: "#f3f4f6", color: "#374151" };
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

const OrdersPage = () => {
  const [statusFilter, setStatusFilter] = useState("Mới");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingStatus, setEditingStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState("");

  const fetchOrders = async (status) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("limit", "40");
      const response = await axios.get(`/api/orders?${params.toString()}`);
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
      const response = await axios.get(`/api/orders/${orderId}`);
      const orderData = response.data?.data || null;
      setSelectedOrder(orderData);
      setEditingStatus(orderData?.status || "");
    } catch (err) {
      setFeedback(err.message || "Không thể tải chi tiết đơn hàng.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || editingStatus === selectedOrder.status) return;
    setUpdating(true);
    try {
      await axios.put(`/api/orders/${selectedOrder.id}/status`, { status: editingStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === selectedOrder.id ? { ...order, status: editingStatus } : order
        )
      );
      setSelectedOrder({ ...selectedOrder, status: editingStatus });
      setFeedback("Đã cập nhật trạng thái đơn hàng.");
    } catch (err) {
      setFeedback(err.message || "Cập nhật trạng thái thất bại.");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  const closeDetail = () => {
    setSelectedOrder(null);
    setEditingStatus("");
  };

  return (
    <div className="pb-4">
      {/* Status Filter Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((status) => {
          const style = STATUS_STYLES[status];
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              className="btn fw-semibold"
              style={{
                background: isActive ? "#1f2937" : style.bg,
                color: isActive ? "#fff" : style.color,
                borderRadius: "20px",
                padding: "8px 20px",
                border: "none",
                transition: "all 0.2s",
              }}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className="alert alert-info d-flex justify-content-between align-items-center" style={{ borderRadius: "12px" }}>
          <span><i className="bi bi-info-circle me-2"></i>{feedback}</span>
          <button type="button" className="btn-close" onClick={() => setFeedback("")} />
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2" style={{ borderRadius: "12px" }}>
          <i className="bi bi-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "16px" }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h5 className="fw-bold mb-1">Danh sách đơn hàng</h5>
              <p className="text-muted small mb-0">
                Đang hiển thị đơn hàng <strong>{statusFilter}</strong>
              </p>
            </div>
            <div
              className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
              style={{ background: "#f0fdf4", color: "#166534" }}
            >
              <i className="bi bi-bag-check"></i>
              <span className="small fw-semibold">{orders.length} đơn</span>
            </div>
          </div>

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
                {loading && (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <div className="spinner-border text-dark" role="status"></div>
                      <p className="mt-2 mb-0 text-muted">Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                )}
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox" style={{ fontSize: "48px" }}></i>
                      <p className="mt-2 mb-0">Không có đơn hàng nào</p>
                    </td>
                  </tr>
                )}
                {!loading &&
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      role="button"
                      onClick={() => fetchDetail(order.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="py-3">
                        <span className="fw-semibold">{order.code}</span>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                              width: "36px",
                              height: "36px",
                              background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                              color: "#4338ca",
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            {(order.shippingName || order.user?.fullName || "K").charAt(0).toUpperCase()}
                          </div>
                          <span>{order.shippingName || order.user?.fullName || "Khách lẻ"}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted">{formatDate(order.orderDate)}</td>
                      <td className="py-3 text-end fw-semibold">{formatCurrency(order.totalAmount)}</td>
                      <td className="py-3 text-end">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <>
          <div className="modal-backdrop fade show" />
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            onClick={closeDetail}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content border-0 shadow" style={{ borderRadius: "16px" }}>
                <div className="modal-header border-0 pb-0">
                  <div>
                    <h5 className="modal-title fw-bold">Chi tiết đơn {selectedOrder.code}</h5>
                    <small className="text-muted">Xem và cập nhật thông tin đơn hàng</small>
                  </div>
                  <button type="button" className="btn-close" onClick={closeDetail} />
                </div>
                <div className="modal-body pt-3">
                  {detailLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-dark" role="status"></div>
                      <p className="mt-2 mb-0 text-muted">Đang tải chi tiết...</p>
                    </div>
                  ) : (
                    <>
                      {/* Customer Info */}
                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <div className="p-3 bg-light rounded-3">
                            <small className="text-muted d-block mb-1">Khách hàng</small>
                            <strong>
                              {selectedOrder.shippingName || selectedOrder.user?.fullName || "Khách lẻ"}
                            </strong>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="p-3 bg-light rounded-3">
                            <small className="text-muted d-block mb-1">Địa chỉ</small>
                            <strong>{selectedOrder.shippingAddress || "Không có"}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Status Update */}
                      <div className="p-3 bg-light rounded-3 mb-4">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                          <div>
                            <small className="text-muted d-block mb-1">Trạng thái đơn hàng</small>
                            <select
                              className="form-select form-select-sm fw-semibold"
                              style={{ width: "auto", borderRadius: "10px" }}
                              value={editingStatus}
                              onChange={(e) => setEditingStatus(e.target.value)}
                            >
                              {STATUS_TABS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            className="btn btn-dark btn-sm"
                            style={{ borderRadius: "10px", padding: "8px 20px" }}
                            disabled={updating || editingStatus === selectedOrder.status}
                            onClick={handleUpdateStatus}
                          >
                            {updating ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Đang cập nhật...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check-lg me-2"></i>
                                Cập nhật
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Order Items */}
                      <h6 className="fw-semibold mb-3">
                        <i className="bi bi-bag me-2"></i>Sản phẩm ({(selectedOrder.items || []).length})
                      </h6>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr className="small text-muted">
                              <th>Sản phẩm</th>
                              <th>Phiên bản</th>
                              <th className="text-center">SL</th>
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
                                      <small className="text-muted">SKU #{item.skuId}</small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark">
                                    {item.color || "—"} / {item.size || "—"}
                                  </span>
                                </td>
                                <td className="text-center fw-semibold">{item.quantity}</td>
                                <td className="text-end fw-semibold">{formatCurrency(item.unitPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Total */}
                      <div className="d-flex justify-content-end mt-3">
                        <div className="p-3 rounded-3" style={{ background: "#f0fdf4" }}>
                          <span className="text-muted me-3">Tổng cộng:</span>
                          <strong className="fs-5" style={{ color: "#047857" }}>
                            {formatCurrency(selectedOrder.totalAmount)}
                          </strong>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    style={{ borderRadius: "10px" }}
                    onClick={closeDetail}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Mount
const mountAdminOrders = () => {
  const container = document.getElementById("admin-orders-root");
  if (!container || !window.ReactDOM || !window.React) return;
  const root = ReactDOM.createRoot(container);
  root.render(<OrdersPage />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAdminOrders);
} else {
  mountAdminOrders();
}
