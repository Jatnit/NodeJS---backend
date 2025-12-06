/**
 * Admin Audit Logs Component
 * Trang hiển thị và quản lý audit logs
 * CHỈ dành cho Super Admin
 */

const AuditLogsPage = () => {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = React.useState({
    actionType: "",
    entityTable: "",
    userId: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Modal state
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);

  // Stats
  const [stats, setStats] = React.useState(null);
  const [activeUsers, setActiveUsers] = React.useState([]);

  // Fetch logs
  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`/api/audit-logs?${params.toString()}`);

      if (response.data.success) {
        setLogs(response.data.data.logs);
        setPagination({
          ...pagination,
          ...response.data.data.pagination,
        });
      } else {
        setError(response.data.message || "Lỗi khi tải dữ liệu");
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Bạn không có quyền truy cập trang này. Chỉ Super Admin mới được phép.");
      } else {
        setError(err.response?.data?.message || "Lỗi kết nối server");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get("/api/audit-logs/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch active users for filter
  const fetchActiveUsers = async () => {
    try {
      const response = await axios.get("/api/audit-logs/users");
      if (response.data.success) {
        setActiveUsers(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Initial load
  React.useEffect(() => {
    fetchLogs(1);
    fetchStats();
    fetchActiveUsers();
  }, []);

  // Fetch when filters change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setFilters({
      actionType: "",
      entityTable: "",
      userId: "",
      startDate: "",
      endDate: "",
      search: "",
    });
    setTimeout(() => fetchLogs(1), 0);
  };

  // View detail
  const handleViewDetail = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  // Action type badge color
  const getActionBadgeClass = (action) => {
    const map = {
      LOGIN: "bg-info",
      LOGOUT: "bg-secondary",
      CREATE: "bg-success",
      UPDATE: "bg-warning text-dark",
      DELETE: "bg-danger",
      VIEW: "bg-light text-dark",
      EXPORT: "bg-primary",
    };
    return map[action] || "bg-secondary";
  };

  // Action type icon
  const getActionIcon = (action) => {
    const map = {
      LOGIN: "bi-box-arrow-in-right",
      LOGOUT: "bi-box-arrow-right",
      CREATE: "bi-plus-circle",
      UPDATE: "bi-pencil",
      DELETE: "bi-trash",
      VIEW: "bi-eye",
      EXPORT: "bi-download",
    };
    return map[action] || "bi-activity";
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Render JSON diff
  const renderJsonDiff = (oldVal, newVal, changedFields) => {
    if (!changedFields || changedFields.length === 0) {
      return <p className="text-muted">Không có thay đổi</p>;
    }

    return (
      <div className="json-diff">
        {changedFields.map((field) => (
          <div key={field} className="diff-row mb-3">
            <div className="diff-field fw-bold mb-2">{field}</div>
            <div className="row g-2">
              <div className="col-md-6">
                <div className="diff-old p-2 rounded bg-danger-subtle">
                  <small className="text-muted d-block mb-1">Trước:</small>
                  <code className="text-danger">
                    {JSON.stringify(oldVal?.[field] ?? null, null, 2)}
                  </code>
                </div>
              </div>
              <div className="col-md-6">
                <div className="diff-new p-2 rounded bg-success-subtle">
                  <small className="text-muted d-block mb-1">Sau:</small>
                  <code className="text-success">
                    {JSON.stringify(newVal?.[field] ?? null, null, 2)}
                  </code>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Error state
  if (error && !logs.length) {
    return (
      <div className="audit-logs-page p-4">
        <div className="alert alert-danger d-flex align-items-center gap-3">
          <i className="bi bi-shield-x fs-1"></i>
          <div>
            <h5 className="mb-1">Truy cập bị từ chối</h5>
            <p className="mb-0">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-logs-page">
      <style>{`
        .audit-logs-page {
          --color-slate: #6c737e;
          --color-steel: #7393a7;
          --color-mist: #b5cfd8;
          --color-cloud: #e8ecf1;
        }

        .page-header {
          background: linear-gradient(135deg, var(--color-slate), var(--color-steel));
          color: white;
          padding: 2rem;
          border-radius: 16px;
          margin-bottom: 1.5rem;
        }

        .page-header h1 {
          font-size: 1.75rem;
          font-weight: 600;
          margin: 0;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border: 1px solid var(--color-cloud);
        }

        .stat-card .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-slate);
        }

        .stat-card .stat-label {
          font-size: 0.85rem;
          color: var(--color-steel);
        }

        .filter-card {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border: 1px solid var(--color-cloud);
          margin-bottom: 1.5rem;
        }

        .logs-table {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border: 1px solid var(--color-cloud);
        }

        .logs-table th {
          background: var(--color-cloud);
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-slate);
          border: none;
        }

        .logs-table td {
          vertical-align: middle;
          border-color: var(--color-cloud);
        }

        .logs-table tr:hover {
          background: rgba(115, 147, 167, 0.05);
        }

        .action-badge {
          font-size: 0.75rem;
          padding: 0.35rem 0.75rem;
          border-radius: 50px;
          font-weight: 600;
        }

        .btn-view {
          background: var(--color-slate);
          color: white;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.85rem;
        }

        .btn-view:hover {
          background: var(--color-steel);
          color: white;
        }

        .pagination-btn {
          border: 1px solid var(--color-cloud);
          background: white;
          color: var(--color-slate);
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--color-cloud);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-btn.active {
          background: var(--color-slate);
          color: white;
          border-color: var(--color-slate);
        }

        .modal-header {
          background: linear-gradient(135deg, var(--color-slate), var(--color-steel));
          color: white;
        }

        .json-diff code {
          display: block;
          white-space: pre-wrap;
          word-break: break-all;
          font-size: 0.85rem;
        }

        .detail-row {
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--color-cloud);
        }

        .detail-label {
          font-weight: 600;
          color: var(--color-steel);
          font-size: 0.85rem;
        }

        .detail-value {
          color: var(--color-slate);
        }

        .form-control, .form-select {
          border-color: var(--color-cloud);
          border-radius: 8px;
        }

        .form-control:focus, .form-select:focus {
          border-color: var(--color-steel);
          box-shadow: 0 0 0 3px rgba(115, 147, 167, 0.15);
        }

        .btn-filter {
          background: var(--color-slate);
          color: white;
          border: none;
          border-radius: 8px;
        }

        .btn-filter:hover {
          background: var(--color-steel);
          color: white;
        }

        .btn-reset {
          background: var(--color-cloud);
          color: var(--color-slate);
          border: none;
          border-radius: 8px;
        }

        .btn-reset:hover {
          background: var(--color-mist);
        }
      `}</style>

      {/* Header */}
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1><i className="bi bi-shield-lock me-2"></i>Audit Logs</h1>
          <p className="mb-0 opacity-75">Theo dõi hoạt động hệ thống - Chỉ Super Admin</p>
        </div>
        <button className="btn btn-light" onClick={() => fetchLogs(pagination.page)}>
          <i className="bi bi-arrow-clockwise me-2"></i>Làm mới
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">{stats.totalLogs?.toLocaleString() || 0}</div>
              <div className="stat-label">Tổng số logs</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">{stats.logsLast7Days?.toLocaleString() || 0}</div>
              <div className="stat-label">7 ngày gần đây</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">
                {stats.byActionType?.find((a) => a.actionType === "UPDATE")?.count || 0}
              </div>
              <div className="stat-label">Cập nhật</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">
                {stats.byActionType?.find((a) => a.actionType === "DELETE")?.count || 0}
              </div>
              <div className="stat-label">Xóa</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-card">
        <div className="row g-3 align-items-end">
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Hành động</label>
            <select
              className="form-select"
              name="actionType"
              value={filters.actionType}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả</option>
              <option value="LOGIN">Đăng nhập</option>
              <option value="LOGOUT">Đăng xuất</option>
              <option value="CREATE">Tạo mới</option>
              <option value="UPDATE">Cập nhật</option>
              <option value="DELETE">Xóa</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Bảng dữ liệu</label>
            <input
              type="text"
              className="form-control"
              name="entityTable"
              value={filters.entityTable}
              onChange={handleFilterChange}
              placeholder="products, orders..."
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Người thực hiện</label>
            <select
              className="form-select"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả</option>
              {activeUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username || user.email}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Từ ngày</label>
            <input
              type="date"
              className="form-control"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Đến ngày</label>
            <input
              type="date"
              className="form-control"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2">
            <div className="d-flex gap-2">
              <button className="btn btn-filter flex-grow-1" onClick={handleApplyFilters}>
                <i className="bi bi-funnel me-1"></i>Lọc
              </button>
              <button className="btn btn-reset" onClick={handleResetFilters}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="logs-table">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th style={{ width: "160px" }}>Thời gian</th>
                  <th style={{ width: "150px" }}>Người thực hiện</th>
                  <th style={{ width: "110px" }}>Hành động</th>
                  <th style={{ width: "120px" }}>Bảng</th>
                  <th>Mô tả</th>
                  <th style={{ width: "100px" }}>IP</th>
                  <th style={{ width: "80px" }}></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="small">{formatDate(log.createdAt)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                            style={{ width: 28, height: 28, fontSize: "0.75rem" }}
                          >
                            {(log.userName || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="small">{log.userName || "-"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`action-badge badge ${getActionBadgeClass(log.actionType)}`}>
                          <i className={`bi ${getActionIcon(log.actionType)} me-1`}></i>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="small">{log.entityTable || "-"}</td>
                      <td className="small" style={{ maxWidth: "300px" }}>
                        <span className="text-truncate d-block" title={log.description}>
                          {log.description || "-"}
                        </span>
                      </td>
                      <td className="small text-muted">{log.ipAddress || "-"}</td>
                      <td>
                        <button className="btn btn-view btn-sm" onClick={() => handleViewDetail(log)}>
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-muted small">
                Hiển thị {logs.length} / {pagination.total} bản ghi
              </div>
              <div className="d-flex gap-2">
                <button
                  className="pagination-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${pagination.page === pageNum ? "active" : ""}`}
                      onClick={() => fetchLogs(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="pagination-btn"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showModal && selectedLog && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">
                  <i className="bi bi-file-text me-2"></i>Chi tiết Log #{selectedLog.id}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="detail-row">
                      <div className="detail-label">Thời gian</div>
                      <div className="detail-value">{formatDate(selectedLog.createdAt)}</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Người thực hiện</div>
                      <div className="detail-value">{selectedLog.userName} ({selectedLog.userEmail || "N/A"})</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Hành động</div>
                      <div className="detail-value">
                        <span className={`action-badge badge ${getActionBadgeClass(selectedLog.actionType)}`}>
                          {selectedLog.actionType}
                        </span>
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Bảng / Entity ID</div>
                      <div className="detail-value">
                        {selectedLog.entityTable || "-"} #{selectedLog.entityId || "-"}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-row">
                      <div className="detail-label">IP Address</div>
                      <div className="detail-value">{selectedLog.ipAddress || "-"}</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Request</div>
                      <div className="detail-value small">
                        {selectedLog.requestMethod} {selectedLog.requestUrl || "-"}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">User Agent</div>
                      <div className="detail-value small text-truncate" title={selectedLog.userAgent}>
                        {selectedLog.userAgent || "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="detail-label mb-2">Mô tả</div>
                  <div className="p-3 bg-light rounded">{selectedLog.description || "Không có mô tả"}</div>
                </div>

                {selectedLog.actionType === "UPDATE" && selectedLog.changedFields?.length > 0 && (
                  <div className="mt-4">
                    <div className="detail-label mb-3">
                      <i className="bi bi-arrow-left-right me-2"></i>So sánh thay đổi
                    </div>
                    {renderJsonDiff(selectedLog.oldValues, selectedLog.newValues, selectedLog.changedFields)}
                  </div>
                )}

                {selectedLog.actionType === "CREATE" && selectedLog.newValues && (
                  <div className="mt-4">
                    <div className="detail-label mb-2">Dữ liệu tạo mới</div>
                    <pre className="p-3 bg-success-subtle rounded small">
                      {JSON.stringify(selectedLog.newValues, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.actionType === "DELETE" && selectedLog.oldValues && (
                  <div className="mt-4">
                    <div className="detail-label mb-2">Dữ liệu bị xóa</div>
                    <pre className="p-3 bg-danger-subtle rounded small">
                      {JSON.stringify(selectedLog.oldValues, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mount component
const auditLogsRoot = document.getElementById("audit-logs-root");
if (auditLogsRoot) {
  ReactDOM.createRoot(auditLogsRoot).render(<AuditLogsPage />);
}
