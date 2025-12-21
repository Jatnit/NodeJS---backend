/**
 * Admin Sidebar Component
 * Sidebar navigation cho trang quản trị
 * - Có nút thu gọn/mở rộng
 * - Super Admin (roleId = 0): Có thể xem Audit Logs
 * - Admin/Manager/Staff: Không thể xem Audit Logs
 */

const ROLE_LABELS = {
  "0": "superadmin",
  "1": "admin",
  "2": "manager",
  "3": "customer",
};

const NAV_ITEMS = [
  {
    id: "dashboard",
    section: "overview",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "bi-speedometer2",
    roles: ["superadmin", "admin", "manager"],
  },
  {
    id: "products",
    section: "management",
    label: "Sản phẩm",
    href: "/admin/products",
    icon: "bi-box-seam",
    roles: ["superadmin", "admin"],
  },
  {
    id: "categories",
    section: "management",
    label: "Danh mục",
    href: "/admin/categories",
    icon: "bi-tags",
    roles: ["superadmin", "admin"],
  },
  {
    id: "orders",
    section: "management",
    label: "Đơn hàng",
    href: "/admin/orders",
    icon: "bi-receipt",
    roles: ["superadmin", "admin", "manager"],
  },
  {
    id: "inventory",
    section: "management",
    label: "Kho hàng",
    href: "/admin/inventory",
    icon: "bi-boxes",
    roles: ["superadmin", "admin", "manager"],
  },
  {
    id: "users",
    section: "management",
    label: "Người dùng",
    href: "/admin/users",
    icon: "bi-people",
    roles: ["superadmin", "admin"],
  },
  {
    id: "audit-logs",
    section: "security",
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: "bi-shield-lock",
    roles: ["superadmin"],
  },
];

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 70;

const sidebarStyles = `
  :root {
    --sidebar-width: ${SIDEBAR_WIDTH}px;
    --sidebar-collapsed-width: ${SIDEBAR_COLLAPSED_WIDTH}px;
    --header-height: 80px;
  }

  .admin-sidebar {
    width: var(--sidebar-width);
    background: linear-gradient(180deg, #6c737e 0%, #4a5159 100%);
    color: white;
    position: fixed;
    left: 0;
    top: var(--header-height);
    height: calc(100vh - var(--header-height));
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 1000;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    transition: width 0.3s ease;
    display: flex;
    flex-direction: column;
  }

  .admin-sidebar.collapsed {
    width: var(--sidebar-collapsed-width);
  }

  .admin-sidebar .sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 60px;
    flex-shrink: 0;
  }

  /* Collapsed header - center toggle button */
  .admin-sidebar.collapsed .sidebar-header {
    justify-content: center;
    padding: 1rem 0.5rem;
  }

  .admin-sidebar .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    overflow: hidden;
    white-space: nowrap;
    transition: all 0.3s ease;
  }

  .admin-sidebar.collapsed .sidebar-brand {
    display: none;
  }

  .admin-sidebar .sidebar-brand-text {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    transition: opacity 0.2s ease;
  }

  .admin-sidebar.collapsed .sidebar-brand-text {
    opacity: 0;
    width: 0;
  }

  .admin-sidebar .super-badge {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    padding: 0.15rem 0.5rem;
    border-radius: 50px;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    transition: opacity 0.2s ease;
  }

  .admin-sidebar.collapsed .super-badge {
    opacity: 0;
    width: 0;
    padding: 0;
  }

  .admin-sidebar .toggle-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .admin-sidebar .toggle-btn:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.05);
  }

  .admin-sidebar .toggle-btn i {
    font-size: 1rem;
  }

  .admin-sidebar .sidebar-nav {
    flex: 1;
    padding: 1rem 0.75rem;
    overflow-y: auto;
  }

  .admin-sidebar.collapsed .sidebar-nav {
    padding: 1rem 0.5rem;
  }

  .admin-sidebar .nav-section {
    margin-bottom: 1rem;
  }

  .admin-sidebar .nav-section-title {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
    padding: 0 0.75rem;
    margin-bottom: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    transition: opacity 0.2s ease;
  }

  .admin-sidebar.collapsed .nav-section-title {
    opacity: 0;
    height: 0;
    margin: 0;
    padding: 0;
  }

  .admin-sidebar .nav-link {
    color: rgba(255, 255, 255, 0.8);
    padding: 0.7rem 0.75rem;
    border-radius: 10px;
    margin-bottom: 0.25rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
  }

  .admin-sidebar .nav-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .admin-sidebar .nav-link.active {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .admin-sidebar .nav-link i {
    font-size: 1.2rem;
    min-width: 24px;
    text-align: center;
    flex-shrink: 0;
  }

  .admin-sidebar .nav-link-text {
    transition: opacity 0.2s ease, width 0.3s ease;
  }

  .admin-sidebar.collapsed .nav-link-text {
    opacity: 0;
    width: 0;
    overflow: hidden;
  }

  .admin-sidebar.collapsed .nav-link {
    justify-content: center;
    padding: 0.75rem;
    margin: 0.25rem auto;
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }

  .admin-sidebar.collapsed .nav-link i {
    margin: 0;
    font-size: 1.3rem;
  }

  .admin-sidebar .sidebar-divider {
    border: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 0.75rem 0;
  }

  .admin-sidebar.collapsed .sidebar-divider {
    margin: 0.5rem 0.5rem;
  }

  .admin-sidebar .sidebar-footer {
    padding: 0.75rem;
    background: rgba(0,0,0,0.15);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }

  .admin-sidebar.collapsed .sidebar-footer {
    padding: 0.75rem 0.5rem;
  }

  .admin-sidebar .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    overflow: hidden;
  }

  .admin-sidebar.collapsed .user-info {
    justify-content: center;
  }

  .admin-sidebar .user-avatar {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.85rem;
  }

  .admin-sidebar .user-details {
    overflow: hidden;
    transition: opacity 0.2s ease, width 0.3s ease;
  }

  .admin-sidebar.collapsed .user-details {
    opacity: 0;
    width: 0;
    display: none;
  }

  .admin-sidebar .user-name {
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .admin-sidebar .user-role {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
  }

  /* Content wrapper */
  .admin-content-wrapper {
    margin-left: var(--sidebar-width);
    padding: 1.5rem 2rem;
    min-height: calc(100vh - var(--header-height));
    transition: margin-left 0.3s ease;
    background: #f8f9fa;
  }

  body.sidebar-collapsed .admin-content-wrapper {
    margin-left: var(--sidebar-collapsed-width);
  }

  /* Footer adjustment */
  body.has-admin-sidebar .site-footer {
    margin-left: var(--sidebar-width);
    transition: margin-left 0.3s ease;
  }

  body.has-admin-sidebar.sidebar-collapsed .site-footer {
    margin-left: var(--sidebar-collapsed-width);
  }

  /* Tooltip for collapsed state */
  .admin-sidebar.collapsed .nav-link {
    position: relative;
  }

  .admin-sidebar.collapsed .nav-link::after {
    content: attr(data-tooltip);
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    background: #333;
    color: white;
    padding: 0.5rem 0.85rem;
    border-radius: 8px;
    font-size: 0.8rem;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    z-index: 1100;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .admin-sidebar.collapsed .nav-link::before {
    content: '';
    position: absolute;
    left: calc(100% + 4px);
    top: 50%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-right-color: #333;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
  }

  .admin-sidebar.collapsed .nav-link:hover::after,
  .admin-sidebar.collapsed .nav-link:hover::before {
    opacity: 1;
    visibility: visible;
  }

  /* Mobile responsive */
  @media (max-width: 991.98px) {
    .admin-sidebar {
      transform: translateX(-100%);
      width: var(--sidebar-width) !important;
    }

    .admin-sidebar.mobile-open {
      transform: translateX(0);
    }

    .admin-content-wrapper {
      margin-left: 0 !important;
    }

    body.has-admin-sidebar .site-footer {
      margin-left: 0 !important;
    }

    .mobile-menu-overlay {
      display: none;
      position: fixed;
      top: var(--header-height);
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }

    .mobile-menu-overlay.show {
      display: block;
    }

    .mobile-toggle-btn {
      display: flex !important;
    }
  }

  .mobile-toggle-btn {
    display: none;
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1050;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #6c737e;
    color: white;
    border: none;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    font-size: 1.25rem;
    cursor: pointer;
    align-items: center;
    justify-content: center;
  }
`;

const Sidebar = ({ role = "customer", currentPath, userName, userRoleId }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem("adminSidebarCollapsed");
    return saved === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  React.useEffect(() => {
    // Save to localStorage
    localStorage.setItem("adminSidebarCollapsed", isCollapsed);
    // Toggle body class
    if (isCollapsed) {
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.body.classList.remove("sidebar-collapsed");
    }
    // Add marker class
    document.body.classList.add("has-admin-sidebar");

    return () => {
      document.body.classList.remove("sidebar-collapsed", "has-admin-sidebar");
    };
  }, [isCollapsed]);

  if (!items.length) {
    return null;
  }

  const overviewItems = items.filter((item) => item.section === "overview");
  const managementItems = items.filter((item) => item.section === "management");
  const securityItems = items.filter((item) => item.section === "security");

  const getRoleLabel = (roleId) => {
    const id = Number(roleId);
    if (id === 0) return "Super Admin";
    if (id === 1) return "Administrator";
    if (id === 2) return "Manager";
    return "Staff";
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  const renderNavLink = (item) => {
    const isActive =
      currentPath === item.href ||
      (item.href !== "/" && currentPath.startsWith(item.href));
    return (
      <a
        key={item.id}
        href={item.href}
        className={`nav-link ${isActive ? "active" : ""}`}
        data-tooltip={item.label}
        onClick={closeMobile}
      >
        <i className={`bi ${item.icon}`}></i>
        <span className="nav-link-text">{item.label}</span>
      </a>
    );
  };

  return (
    <>
      <style>{sidebarStyles}</style>

      {/* Mobile overlay */}
      <div
        className={`mobile-menu-overlay ${isMobileOpen ? "show" : ""}`}
        onClick={closeMobile}
      ></div>

      <aside className={`admin-sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="bi bi-grid-1x2-fill" style={{ fontSize: "1.2rem" }}></i>
            <span className="sidebar-brand-text">ADMIN</span>
            {Number(userRoleId) === 0 && <span className="super-badge">Super</span>}
          </div>
          <button className="toggle-btn" onClick={toggleCollapse} title={isCollapsed ? "Mở rộng" : "Thu gọn"}>
            <i className={`bi ${isCollapsed ? "bi-chevron-right" : "bi-chevron-left"}`}></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {overviewItems.length > 0 && (
            <div className="nav-section">
              <div className="nav-section-title">Tổng quan</div>
              {overviewItems.map(renderNavLink)}
            </div>
          )}

          {managementItems.length > 0 && (
            <div className="nav-section">
              <div className="nav-section-title">Quản lý</div>
              {managementItems.map(renderNavLink)}
            </div>
          )}

          {securityItems.length > 0 && (
            <>
              <hr className="sidebar-divider" />
              <div className="nav-section">
                <div className="nav-section-title">Bảo mật</div>
                {securityItems.map(renderNavLink)}
              </div>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(userName || "A").charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{userName || "Admin"}</div>
              <div className="user-role">{getRoleLabel(userRoleId)}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile toggle */}
      <button className="mobile-toggle-btn" onClick={toggleMobile}>
        <i className={`bi ${isMobileOpen ? "bi-x-lg" : "bi-list"}`}></i>
      </button>
    </>
  );
};

const mountSidebar = () => {
  const container = document.getElementById("admin-sidebar-root");
  if (!container || !window.React || !window.ReactDOM) {
    return;
  }

  const roleValue =
    container.closest("[data-role]")?.dataset?.role ||
    container.parentElement?.dataset?.role ||
    container.dataset?.role ||
    "3";

  const userName =
    container.closest("[data-username]")?.dataset?.username ||
    container.parentElement?.dataset?.username ||
    container.dataset?.username ||
    "Admin";

  // Convert to string and lookup role
  const roleKey = String(roleValue);
  const role = ROLE_LABELS[roleKey] || "customer";
  const currentPath = window.location.pathname;
  
  console.log("[AdminSidebar] roleValue:", roleValue, "-> role:", role);

  // Check access
  if (
    role === "manager" &&
    !NAV_ITEMS.some(
      (item) =>
        item.roles.includes("manager") &&
        (currentPath === item.href ||
          (item.href !== "/" && currentPath.startsWith(item.href)))
    )
  ) {
    window.location.href = "/admin/dashboard?status=forbidden";
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(
    <Sidebar
      role={role}
      currentPath={currentPath}
      userName={userName}
      userRoleId={roleValue}
    />
  );
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountSidebar);
} else {
  mountSidebar();
}
