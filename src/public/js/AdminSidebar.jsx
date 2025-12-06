/**
 * Admin Sidebar Component
 * Sidebar navigation cho trang quản trị
 * - Super Admin (roleId = 0): Có thể xem Audit Logs
 * - Admin/Manager/Staff: Không thể xem Audit Logs
 */

const ROLE_LABELS = {
  0: "superadmin",
  1: "admin",
  2: "manager",
  3: "customer",
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
    roles: ["superadmin"], // CHỈ Super Admin
  },
];

const sidebarStyles = `
  .admin-sidebar {
    width: 240px;
    background: linear-gradient(180deg, #6c737e 0%, #4a5159 100%);
    color: white;
    padding: 1.5rem 1rem;
    position: fixed;
    left: 0;
    top: 70px;
    height: calc(100vh - 70px);
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  }

  .admin-sidebar .sidebar-brand {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 1.5rem;
    padding: 0 0.5rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .admin-sidebar .super-badge {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    padding: 0.2rem 0.6rem;
    border-radius: 50px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .admin-sidebar .nav-section {
    margin-bottom: 1rem;
  }

  .admin-sidebar .nav-section-title {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
    padding: 0 0.75rem;
    margin-bottom: 0.5rem;
  }

  .admin-sidebar .nav-link {
    color: rgba(255, 255, 255, 0.8);
    padding: 0.75rem 1rem;
    border-radius: 10px;
    margin-bottom: 0.25rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .admin-sidebar .nav-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: translateX(3px);
  }

  .admin-sidebar .nav-link.active {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .admin-sidebar .nav-link i {
    font-size: 1.1rem;
    width: 22px;
    text-align: center;
  }

  .admin-sidebar .sidebar-divider {
    border: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 1rem 0;
  }

  .admin-sidebar .sidebar-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    background: rgba(0,0,0,0.1);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .admin-sidebar .sidebar-footer .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .admin-sidebar .sidebar-footer .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .admin-sidebar .sidebar-footer .user-name {
    font-size: 0.85rem;
    font-weight: 600;
  }

  .admin-sidebar .sidebar-footer .user-role {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .admin-content-wrapper {
    margin-left: 240px;
    padding: 1.5rem 2rem;
    min-height: calc(100vh - 70px);
  }

  .mobile-sidebar-toggle {
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
  }

  @media (max-width: 991.98px) {
    .admin-sidebar {
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    .admin-sidebar.show {
      transform: translateX(0);
    }

    .admin-content-wrapper {
      margin-left: 0;
    }

    .mobile-sidebar-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
`;

const Sidebar = ({ role = "customer", currentPath, userName, userRoleId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  if (!items.length) {
    return null;
  }

  // Group items by section
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

  const renderNavLink = (item) => {
    const isActive =
      currentPath === item.href ||
      (item.href !== "/" && currentPath.startsWith(item.href));
    return (
      <a
        key={item.id}
        href={item.href}
        className={`nav-link ${isActive ? "active" : ""}`}
      >
        <i className={`bi ${item.icon}`}></i>
        {item.label}
      </a>
    );
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <style>{sidebarStyles}</style>
      <aside className={`admin-sidebar ${isOpen ? "show" : ""}`}>
        <div className="sidebar-brand">
          <span>ADMIN</span>
          {Number(userRoleId) === 0 && <span className="super-badge">Super</span>}
        </div>

        <nav>
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

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(userName || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="user-name">{userName || "Admin"}</div>
              <div className="user-role">{getRoleLabel(userRoleId)}</div>
            </div>
          </div>
        </div>
      </aside>

      <button className="mobile-sidebar-toggle" onClick={toggleSidebar}>
        <i className={`bi ${isOpen ? "bi-x-lg" : "bi-list"}`}></i>
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
    container.parentElement?.dataset?.role ||
    container.closest("[data-role]")?.dataset?.role ||
    container.dataset?.role ||
    "3";
    
  const userName =
    container.parentElement?.dataset?.username ||
    container.closest("[data-username]")?.dataset?.username ||
    container.dataset?.username ||
    "Admin";

  const role = ROLE_LABELS[roleValue] || ROLE_LABELS[String(roleValue)] || "customer";
  const currentPath = window.location.pathname;

  // Check access for non-super-admin and non-admin
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
