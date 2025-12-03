const ROLE_LABELS = {
  1: "admin",
  2: "manager",
  3: "customer",
};

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    roles: ["admin", "manager"],
  },
  {
    id: "users",
    label: "Users",
    href: "/admin/users",
    roles: ["admin"],
  },
  {
    id: "categories",
    label: "Categories",
    href: "/admin/categories",
    roles: ["admin"],
  },
  {
    id: "products",
    label: "Products",
    href: "/admin/products",
    roles: ["admin"],
  },
  {
    id: "orders",
    label: "Orders",
    href: "/admin/orders",
    roles: ["admin", "manager"],
  },
  {
    id: "inventory",
    label: "Warehouse",
    href: "/admin/inventory",
    roles: ["admin", "manager"],
  },
];

const Sidebar = ({ role = "customer", currentPath }) => {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  if (!items.length) {
    return null;
  }
  return (
    <div className="d-flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive =
          currentPath === item.href ||
          (item.href !== "/" && currentPath.startsWith(item.href));
        return (
          <a
            key={item.id}
            href={item.href}
            className={`btn ${
              isActive ? "btn-dark" : "btn-outline-dark"
            } text-uppercase fw-semibold`}
            style={{ letterSpacing: "0.2em" }}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
};

const mountSidebar = () => {
  const container = document.getElementById("admin-sidebar-root");
  if (!container || !window.React || !window.ReactDOM) {
    return;
  }
  const roleValue =
    container.parentElement?.dataset.role ||
    container.dataset.role ||
    "3";
  const role = ROLE_LABELS[roleValue] || ROLE_LABELS[String(roleValue)] || "customer";
  const currentPath = window.location.pathname;

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
  root.render(<Sidebar role={role} currentPath={currentPath} />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountSidebar);
} else {
  mountSidebar();
}


