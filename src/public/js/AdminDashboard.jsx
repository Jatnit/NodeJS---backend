const { useEffect, useMemo, useState } = React;

const {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip: RechartsTooltip,
} = Recharts || {};

const createIcon = (iconClass) => {
  return ({ size = 18, className = "" }) => (
    <i
      className={`bi ${iconClass} ${className}`}
      style={{ fontSize: `${size}px`, lineHeight: 1, display: "inline-flex" }}
    />
  );
};

const DollarSign = createIcon("bi-currency-dollar");
const ShoppingBag = createIcon("bi-bag");
const Package = createIcon("bi-box-seam");
const BarChart3 = createIcon("bi-graph-up");
const AlertCircle = createIcon("bi-exclamation-circle");
const Loader2 = ({ size = 16, className = "" }) => (
  <i
    className={`bi bi-arrow-repeat ${className}`}
    style={{ fontSize: `${size}px`, lineHeight: 1, display: "inline-flex" }}
  />
);

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

const StatCard = ({ title, value, icon: Icon, loading, accent }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}
      >
        {Icon ? <Icon size={18} /> : null}
      </div>
    </div>
    {loading ? (
      <>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-16" />
      </>
    ) : (
      <>
        <p className="text-3xl font-semibold text-gray-900 leading-none">
          {value}
        </p>
        <span className="text-sm text-emerald-600 font-medium">
          Dữ liệu thực
        </span>
      </>
    )}
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    "Hoàn thành": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Đang xử lý": "bg-blue-100 text-blue-700 border-blue-200",
    "Đang giao": "bg-sky-100 text-sky-700 border-sky-200",
    "Đã hủy": "bg-rose-100 text-rose-700 border-rose-200",
    "Chờ xác nhận": "bg-amber-100 text-amber-700 border-amber-200",
  };
  const style = colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full border ${style}`}
    >
      {status}
    </span>
  );
};

const RevenueChart = ({ data, loading }) => {
  if (!AreaChart) {
    return (
      <div className="h-72 flex items-center justify-center text-gray-500 text-sm">
        Biểu đồ đang được tải...
      </div>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <div className="h-72">
      {loading ? (
        <Skeleton className="w-full h-full rounded-xl" />
      ) : hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                value >= 1_000_000
                  ? `${Math.round(value / 1_000_000)}M`
                  : `${value}`
              }
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <RechartsTooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => `Ngày ${label}`}
              contentStyle={{
                borderRadius: "14px",
                borderColor: "#e2e8f0",
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#7C3AED"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          Chưa có dữ liệu doanh thu trong 7 ngày.
        </div>
      )}
    </div>
  );
};

const RecentOrdersTable = ({ orders, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="grid grid-cols-5 gap-4 items-center border border-gray-100 rounded-xl px-4 py-3"
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24 justify-self-end" />
            <Skeleton className="h-6 w-24 justify-self-end" />
          </div>
        ))}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="text-sm text-gray-500 flex items-center gap-2 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-6">
        <BarChart3 size={18} className="text-gray-400" />
        Chưa có đơn hàng nào gần đây.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="grid grid-cols-5 gap-4 items-center border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition"
        >
          <div className="text-sm font-semibold text-gray-900">
            {order.code}
          </div>
          <div className="text-sm text-gray-700">{order.customerName}</div>
          <div className="text-sm text-gray-500">
            {new Date(order.orderDate).toLocaleDateString("vi-VN")}
          </div>
          <div className="text-right text-sm font-semibold text-gray-900">
            {formatCurrency(order.totalAmount)}
          </div>
          <div className="justify-self-end">
            <StatusBadge status={order.status} />
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardHome = () => {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser =
    (window.__ADMIN_DASHBOARD__ && window.__ADMIN_DASHBOARD__.currentUser) ||
    null;

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, ordersRes] = await Promise.all([
          axios.get("/api/dashboard/summary"),
          axios.get("/api/orders/recent"),
        ]);

        if (!isMounted) return;

        setSummary(summaryRes.data?.data || summaryRes.data || null);
        setOrders(ordersRes.data?.data || ordersRes.data || []);
      } catch (err) {
        console.log("Dashboard fetch error:", err);
        if (isMounted) {
          setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const chartData = useMemo(
    () =>
      (summary?.recentRevenue || []).map((item) => ({
        label: item.label || item.date,
        revenue: Number(item.total || item.value || 0),
      })),
    [summary]
  );

  const stats = [
    {
      key: "revenue",
      title: "Tổng doanh thu",
      value: formatCurrency(summary?.totalRevenue),
      icon: DollarSign,
      accent: "bg-indigo-50 text-indigo-600",
    },
    {
      key: "orders",
      title: "Tổng đơn hàng",
      value: (summary?.totalOrders || 0).toLocaleString("vi-VN"),
      icon: ShoppingBag,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      key: "products",
      title: "Tổng sản phẩm",
      value: (summary?.totalProducts || 0).toLocaleString("vi-VN"),
      icon: Package,
      accent: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="inline-flex items-center gap-2 text-sm text-indigo-600 font-semibold">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Bảng điều khiển
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                Xin chào, {currentUser?.username || currentUser?.email || "Admin"}
              </h1>
              <p className="text-gray-500">
                Cập nhật nhanh hiệu suất kinh doanh trong 7 ngày qua.
              </p>
            </div>
            <a
              href="/admin/orders"
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition"
            >
              <BarChart3 size={16} />
              Xem đơn hàng
            </a>
          </div>
        </header>

        {error ? (
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl px-4 py-3">
            {AlertCircle ? <AlertCircle size={18} className="mt-0.5" /> : null}
            <div>
              <p className="font-semibold">Đã xảy ra lỗi</p>
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          </div>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <StatCard
              key={stat.key}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              accent={stat.accent}
              loading={loading}
            />
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6 xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-500 font-semibold">
                  Revenue
                </p>
                <h3 className="text-xl font-semibold text-gray-900">
                  Doanh thu 7 ngày gần nhất
                </h3>
                <p className="text-sm text-gray-500">
                  Số liệu được tổng hợp từ các đơn đã hoàn thành.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {Loader2 && loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : null}
                <span>{loading ? "Đang tải" : "Cập nhật thời gian thực"}</span>
              </div>
            </div>
            <RevenueChart data={chartData} loading={loading} />
          </div>

          <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 rounded-2xl p-6 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-white/80 font-semibold">
              Snapshot
            </p>
            <h3 className="text-xl font-semibold mt-1 mb-4">
              Hiệu suất ngắn hạn
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Doanh thu tuần</span>
                <span className="font-semibold">
                  {formatCurrency(
                    chartData.reduce((sum, item) => sum + (item.revenue || 0), 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Số đơn</span>
                <span className="font-semibold">
                  {(summary?.totalOrders || 0).toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Sản phẩm đang bán</span>
                <span className="font-semibold">
                  {(summary?.totalProducts || 0).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white/90">
              <p className="font-semibold mb-1">Gợi ý</p>
              <p>
                Theo dõi sát đơn đang xử lý và tối ưu tồn kho cho các sản phẩm
                bán chạy.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">
                Recent orders
              </p>
              <h3 className="text-xl font-semibold text-gray-900">
                Đơn hàng gần đây
              </h3>
              <p className="text-sm text-gray-500">
                Danh sách 8 đơn mới nhất cập nhật theo thời gian thực.
              </p>
            </div>
            <a
              href="/admin/orders"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Xem tất cả
            </a>
          </div>
          <RecentOrdersTable orders={orders} loading={loading} />
        </section>
      </div>
    </div>
  );
};

const mountAdminDashboard = () => {
  const container = document.getElementById("admin-dashboard-root");
  if (!container || !window.ReactDOM) return;
  const root = ReactDOM.createRoot(container);
  root.render(<DashboardHome />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAdminDashboard);
} else {
  mountAdminDashboard();
}
