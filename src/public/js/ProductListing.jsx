const { useEffect, useMemo, useState } = React;
const DEFAULT_LIMIT = 9;

const REVIEW_TEMPLATE = {
  summary: { averageRating: 0, totalReviews: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
  items: [],
};

const getPriceLabel = (priceRange) => {
  if (!priceRange) return "Liên hệ";
  const min = Number(priceRange.min) || 0;
  const max = Number(priceRange.max) || min;
  if (min === max) {
    return min.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  }
  return `${min.toLocaleString("vi-VN")} - ${max.toLocaleString(
    "vi-VN"
  )} VND`;
};

const COLOR_SWATCH_PALETTE = {
  trắng: "#F7F7F7",
  white: "#F7F7F7",
  đen: "#111111",
  black: "#111111",
  vàng: "#F3C257",
  beige: "#E5D1B8",
  nâu: "#8B5E3C",
  ivory: "#EFE6DA",
  xanh: "#7396C8",
};

const getSwatchHex = (label) => {
  if (!label) return "#dcdcdc";
  const normalized = label.trim().toLowerCase();
  return COLOR_SWATCH_PALETTE[normalized] || "#dcdcdc";
};

const COLOR_SWATCHES = [
  { id: 3, label: "Yellow", hex: "#F3C257" },
  { id: 2, label: "Black", hex: "#111111" },
  { id: 1, label: "White", hex: "#F5F5F5", border: "#D9D9D9" },
];

const SIZE_OPTIONS = [
  { id: 4, label: "XS" },
  { id: 5, label: "S" },
  { id: 6, label: "M" },
  { id: 7, label: "L" },
  { id: 8, label: "XL" },
];

const styles = `
  .product-page {
    background: var(--app-bg, #f8f8f8);
    padding-bottom: 4rem;
  }
  .product-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2.5rem;
  }
  @media (max-width: 991px) {
    .product-layout {
      grid-template-columns: 1fr;
    }
  }
  .filters-panel {
    background: var(--card-bg, #fff);
    border-radius: 28px;
    padding: 2rem;
    box-shadow: 0 30px 80px rgba(15, 15, 15, 0.08);
    position: sticky;
    top: 110px;
    height: fit-content;
  }
  .filters-panel h5 {
    font-size: 0.85rem;
    letter-spacing: 0.3em;
    font-weight: 600;
    color: #8d7a5f;
  }
  .filter-section + .filter-section {
    margin-top: 2rem;
  }
  .category-list {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .category-list label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
  }
  .price-form {
    margin-top: 1rem;
  }
  .price-form::after {
    content: "";
    display: block;
    clear: both;
  }
  .price-inputs {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .price-inputs input {
    flex: none;
    width: 92px;
    border-radius: 999px;
    border: 1px solid #e3e3e3;
    padding: 0.35rem 0.9rem;
    background: transparent;
    text-align: center;
  }
  .price-form button {
    display: none;
  }
  .swatches {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }
  .swatch {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    position: relative;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .swatch.selected {
    border-color: #111;
    transform: translateY(-3px);
  }
  .swatch::after {
    content: attr(data-label);
    position: absolute;
    bottom: -1.8rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #777;
  }
  .size-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-top: 1rem;
  }
  .size-pill {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    border: 1px solid #d8d8d8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .size-pill.selected {
    background: #111;
    color: #fff;
    border-color: #111;
  }
  .products-panel {
    background: transparent;
    min-width: 0;
  }
  .products-toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .toolbar-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .toolbar-actions select {
    border-radius: 999px;
    border: 1px solid #dcdcdc;
    padding: 0.45rem 1.25rem;
    background: transparent;
  }
  .product-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2.25rem;
    align-items: stretch;
  }
  @media (max-width: 1200px) {
    .product-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2rem;
    }
  }
  @media (max-width: 768px) {
    .product-grid {
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1.5rem;
    }
  }
  .product-card {
    position: relative;
    border-radius: 32px;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,245,245,1));
    box-shadow: 0 25px 60px rgba(20, 20, 20, 0.08);
    width: 100%;
  }
  .product-card figure {
    margin: 0;
  }
  .product-card img {
    width: 100%;
    aspect-ratio: 3/4;
    object-fit: cover;
    transition: transform 0.45s ease;
  }
  .product-card:hover img {
    transform: scale(1.05);
  }
  .product-meta {
    padding: 1.25rem 1.5rem 1.5rem;
  }
  .product-meta h4 {
    font-size: 1rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 0.6rem;
  }
  .price-tag {
    font-weight: 600;
    color: #b48b57;
  }
  .card-hover {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.45);
    opacity: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s ease;
  }
  .product-card:hover .card-hover {
    opacity: 1;
  }
  .card-hover .hover-actions {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    width: 100%;
    max-width: 220px;
  }
  .card-hover button {
    border-radius: 999px;
    padding: 0.55rem 1.5rem;
    border: none;
    font-weight: 600;
    letter-spacing: 0.15em;
  }
  .card-hover button.add {
    background: #111;
    color: #fff;
  }
  .empty-state, .error-state {
    text-align: center;
    padding: 3rem 0;
    color: #777;
  }
  .pagination {
    margin-top: 2.5rem;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .pagination button {
    border: none;
    border-radius: 50%;
    width: 46px;
    height: 46px;
    font-weight: 600;
    cursor: pointer;
    background: rgba(0,0,0,0.06);
  }
  .pagination button.active {
    background: #111;
    color: #fff;
  }
  .pagination button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .filter-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
  }
  .filter-actions button {
    flex: 1;
    border: none;
    border-radius: 999px;
    padding: 0.85rem 1.25rem;
    font-weight: 600;
    letter-spacing: 0.1em;
  }
  .filter-actions .primary {
    background: #111;
    color: #fff;
  }
  .filter-actions .ghost {
    background: transparent;
    border: 1px solid #d1d1d1;
    color: #333;
  }
  .skeleton-card {
    border-radius: 32px;
    background: linear-gradient(120deg, rgba(255,255,255,0.8), rgba(240,240,240,0.8));
    min-height: 380px;
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.65; }
    100% { opacity: 1; }
  }
  .detail-error-toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #111;
    color: #fff;
    padding: 1rem 1.5rem;
    border-radius: 999px;
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 1200;
  }
  .detail-error-toast button {
    border: none;
    background: transparent;
    color: #fff;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.15em;
  }
  .product-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 3rem 1.5rem;
    overflow-y: auto;
    z-index: 1150;
  }
  .product-modal {
    background: var(--card-bg, #fff);
    border-radius: 36px;
    width: min(1100px, 100%);
    box-shadow: 0 35px 120px rgba(0,0,0,0.25);
    padding: 2.5rem;
    position: relative;
  }
  .product-modal__close {
    position: absolute;
    top: 1.5rem;
    right: 1.75rem;
    border: none;
    background: rgba(0,0,0,0.08);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    font-size: 1.2rem;
  }
  .product-modal__body {
    display: grid;
    grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
    gap: 2.5rem;
  }
  .product-modal__gallery {
    border-radius: 28px;
    background: rgba(249,249,249,0.8);
    padding: 1.25rem;
  }
  .product-modal__image {
    width: 100%;
    border-radius: 24px;
    aspect-ratio: 3/4;
    object-fit: cover;
    background: #fff;
  }
  .product-modal__thumbs {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }
  .product-modal__thumb {
    width: 72px;
    height: 72px;
    border-radius: 18px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
  }
  .product-modal__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .product-modal__thumb.active {
    border-color: #111;
  }
  .product-modal__info h3 {
    letter-spacing: 0.18em;
  }
  .product-modal__price {
    font-size: 1.35rem;
    font-weight: 600;
    color: #b48b57;
  }
  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .pill-row button {
    min-width: 48px;
    min-height: 40px;
    border-radius: 999px;
    border: 1px solid #dcdcdc;
    background: transparent;
    font-weight: 600;
    letter-spacing: 0.1em;
  }
  .pill-row button.active {
    background: #111;
    color: #fff;
    border-color: #111;
  }
  .swatch-row {
    display: flex;
    gap: 0.75rem;
  }
  .swatch-pill {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
  }
  .swatch-pill.active {
    border-color: #111;
  }
  .product-modal__actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  .product-modal__actions button {
    border-radius: 999px;
    padding: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.2em;
  }
  .product-modal__related {
    margin-top: 3rem;
  }
  .product-modal__related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.25rem;
    margin-top: 1rem;
  }
  .related-card {
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.05);
    cursor: pointer;
    background: var(--card-bg, #fff);
  }
  .related-card img {
    width: 100%;
    aspect-ratio: 3/4;
    object-fit: cover;
  }
  .related-card h6 {
    font-size: 0.9rem;
    letter-spacing: 0.18em;
    margin: 0.75rem;
  }
  .review-section {
    margin-top: 2.5rem;
    padding-top: 2.5rem;
    border-top: 1px solid rgba(0,0,0,0.08);
  }
  .review-summary {
    display: flex;
    gap: 2.5rem;
    flex-wrap: wrap;
  }
  .review-score {
    font-size: 3rem;
    font-weight: 700;
  }
  .review-bars {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .review-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .review-bar-track {
    flex: 1;
    height: 6px;
    background: rgba(0,0,0,0.08);
    border-radius: 999px;
    overflow: hidden;
  }
  .review-bar-track span {
    display: block;
    height: 100%;
    background: #111;
  }
  .review-list {
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .review-card {
    border-radius: 20px;
    border: 1px solid rgba(0,0,0,0.06);
    padding: 1.25rem;
    background: rgba(249,249,249,0.65);
  }
  .cart-feedback {
    font-size: 0.85rem;
    letter-spacing: 0.1em;
  }
`;

const toggleValue = (list, value) => {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }
  return [...list, value];
};

const ProductListing = ({ initialCategories = [] }) => {
  const [filters, setFilters] = useState({
    categories: [],
    colors: [],
    sizes: [],
    minPrice: "",
    maxPrice: "",
  });
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const handlePriceSubmit = (event) => {
    event.preventDefault();
    setPage(1);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categories = params.get("categories")
      ? params
          .get("categories")
          .split(",")
          .filter(Boolean)
      : [];
    const colors = params.get("colors")
      ? params
          .get("colors")
          .split(",")
          .filter(Boolean)
      : [];
    const sizes = params.get("sizes")
      ? params
          .get("sizes")
          .split(",")
          .filter(Boolean)
      : [];
    setFilters({
      categories,
      colors,
      sizes,
      minPrice: params.get("minPrice") || "",
      maxPrice: params.get("maxPrice") || "",
    });
    setSort(params.get("sort") || "newest");
    setPage(Number(params.get("page")) || 1);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (activeProduct || detailLoading) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [activeProduct, detailLoading]);

  const openProductDetail = async (productId) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const endpoint = `/api/products/${productId}`;
      let payload;
      if (window.axios) {
        const response = await window.axios.get(endpoint);
        payload = response.data;
      } else {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error("Network error");
        payload = await response.json();
      }
      if (!payload || !payload.data) {
        throw new Error("Invalid response");
      }

      setActiveProduct({
        ...payload.data,
        recommendations: payload.recommendations || [],
        reviews: payload.reviews || REVIEW_TEMPLATE,
      });
    } catch (err) {
      console.error("Failed to load product detail", err);
      setDetailError("Không thể tải thông tin sản phẩm. Vui lòng thử lại.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeProductDetail = () => {
    setActiveProduct(null);
  };

  const queryString = useMemo(() => {
    if (!hydrated) return "";
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(DEFAULT_LIMIT));
    params.set("sort", sort);

    if (filters.categories.length) {
      params.set("categories", filters.categories.join(","));
    }
    if (filters.colors.length) {
      params.set("colors", filters.colors.join(","));
    }
    if (filters.sizes.length) {
      params.set("sizes", filters.sizes.join(","));
    }
    if (filters.minPrice) {
      params.set("minPrice", filters.minPrice);
    }
    if (filters.maxPrice) {
      params.set("maxPrice", filters.maxPrice);
    }
    return params.toString();
  }, [filters, sort, page, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const nextUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);

    const fetchProducts = async () => {
      setIsLoading(true);
      setError("");
      try {
        const requestUrl = queryString
          ? `/api/products?${queryString}`
          : `/api/products`;

        let payload;
        if (window.axios) {
          const response = await window.axios.get(requestUrl);
          payload = response.data;
        } else {
          const response = await fetch(requestUrl);
          if (!response.ok) throw new Error("Network error");
          payload = await response.json();
        }

        setProducts(payload.data || []);
        setPagination(payload.pagination || { total: 0, totalPages: 0 });
      } catch (err) {
        console.error("Failed to fetch products", err);
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [queryString, hydrated]);

  const handleCategoryChange = (id) => {
    setFilters((prev) => ({
      ...prev,
      categories: toggleValue(prev.categories, String(id)),
    }));
    setPage(1);
  };

  const handleColorChange = (id) => {
    setFilters((prev) => ({
      ...prev,
      colors: toggleValue(prev.colors, String(id)),
    }));
    setPage(1);
  };

  const handleSizeChange = (id) => {
    setFilters((prev) => ({
      ...prev,
      sizes: toggleValue(prev.sizes, String(id)),
    }));
    setPage(1);
  };

  const handlePriceChange = (field, value) => {
    if (value === "" || /^[0-9]*$/.test(value)) {
      setFilters((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      colors: [],
      sizes: [],
      minPrice: "",
      maxPrice: "",
    });
    setPage(1);
  };

  const goToPage = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = pagination.totalPages || 0;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="product-page">
      <style>{styles}</style>
      <div className="product-layout">
        <aside className="filters-panel">
          <div className="filter-section">
            <h5>Categories</h5>
            <ul className="category-list">
              {initialCategories.length === 0 && (
                <li className="text-muted">Chưa có danh mục.</li>
              )}
              {initialCategories.map((category) => (
                <li key={category.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(String(category.id))}
                      onChange={() => handleCategoryChange(category.id)}
                    />
                    <span>{category.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="filter-section">
            <h5>Price</h5>
            <form className="price-form" onSubmit={handlePriceSubmit}>
              <div className="price-inputs">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(event) =>
                    handlePriceChange("minPrice", event.target.value)
                  }
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(event) =>
                    handlePriceChange("maxPrice", event.target.value)
                  }
                />
              </div>
              <button type="submit">Apply price</button>
            </form>
          </div>

          <div className="filter-section">
            <h5>Color</h5>
            <div className="swatches">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  className={`swatch ${
                    filters.colors.includes(String(swatch.id)) ? "selected" : ""
                  }`}
                  style={{
                    background: swatch.hex,
                    borderColor: filters.colors.includes(String(swatch.id))
                      ? "#111"
                      : swatch.border || "transparent",
                  }}
                  data-label={swatch.label}
                  onClick={() => handleColorChange(swatch.id)}
                />
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h5>Size</h5>
            <div className="size-list">
              {SIZE_OPTIONS.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  className={`size-pill ${
                    filters.sizes.includes(String(size.id)) ? "selected" : ""
                  }`}
                  onClick={() => handleSizeChange(size.id)}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-actions">
            <button
              type="button"
              className="ghost"
              onClick={clearFilters}
              disabled={
                !filters.categories.length &&
                !filters.colors.length &&
                !filters.sizes.length &&
                !filters.minPrice &&
                !filters.maxPrice
              }
            >
              Clear
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => setPage(1)}
            >
              Apply
            </button>
          </div>
        </aside>

        <section className="products-panel">
          <div className="products-toolbar">
            <div>
              <p className="text-uppercase fw-semibold text-muted mb-1" style={{ letterSpacing: "0.3em" }}>
                SHOP THE DROP
              </p>
              <small className="text-muted">
                {pagination.total
                  ? `${pagination.total} sản phẩm được tìm thấy`
                  : "Chọn bộ lọc để xem gợi ý hoàn hảo"}
              </small>
            </div>
            <div className="toolbar-actions">
              <label className="text-muted" style={{ fontSize: "0.9rem" }}>
                Sort by
              </label>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
              </select>
            </div>
          </div>

          {error && <div className="error-state">{error}</div>}

          {!error && (
            <>
              {isLoading && (
                <div className="product-grid">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="skeleton-card" />
                  ))}
                </div>
              )}

              {!isLoading && products.length === 0 && (
                <div className="empty-state">
                  Không có sản phẩm khớp với bộ lọc của bạn.
                </div>
              )}

              {!isLoading && products.length > 0 && (
                <>
                  <div className="product-grid">
                    {products.map((product) => (
                      <article
                        key={product.id}
                        className="product-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => openProductDetail(product.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            openProductDetail(product.id);
                          }
                        }}
                      >
                        <figure>
                          <img
                            src={
                              product.thumbnailUrl ||
                              "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80"
                            }
                            alt={product.name}
                          />
                          <div className="card-hover">
                            <div className="hover-actions">
                              <button className="btn btn-light text-uppercase">
                                View Detail
                              </button>
                              <button className="btn btn-light text-uppercase add">
                                Add To Cart
                              </button>
                            </div>
                          </div>
                        </figure>
                        <div className="product-meta">
                          <h4>{product.name}</h4>
                          <div className="price-tag">
                            {getPriceLabel(product.priceRange)}
                          </div>
                          <div className="mt-2 d-flex flex-wrap gap-2 text-muted" style={{ fontSize: "0.8rem" }}>
                            {product.categories?.map((category) => (
                              <span key={category.id}>#{category.slug}</span>
                            ))}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  {pagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        type="button"
                        onClick={() => goToPage(Math.max(page - 1, 1))}
                        disabled={page === 1}
                      >
                        ‹
                      </button>
                      {pageNumbers.map((pageNumber) => (
                        <button
                          type="button"
                          key={pageNumber}
                          className={pageNumber === page ? "active" : ""}
                          onClick={() => goToPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          goToPage(Math.min(page + 1, totalPages))
                        }
                        disabled={page === totalPages}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
      {detailLoading && (
        <div className="product-modal-overlay">
          <div className="product-modal text-center">
            <p className="mb-0">Đang tải thông tin sản phẩm...</p>
          </div>
        </div>
      )}
      {activeProduct && (
        <ProductDetailModal
          product={activeProduct}
          onClose={closeProductDetail}
          onSelectProduct={openProductDetail}
        />
      )}
      {detailError && (
        <div className="detail-error-toast">
          <span>{detailError}</span>
          <button type="button" onClick={() => setDetailError("")}>
            Đóng
          </button>
        </div>
      )}
    </div>
  );
};

const ProductDetailModal = ({ product, onClose, onSelectProduct }) => {
  const [activeImage, setActiveImage] = useState(
    (product.images && product.images[0]) || product.thumbnailUrl
  );
  const [selectedColor, setSelectedColor] = useState(
    product.attributes?.colors?.[0]?.id || null
  );
  const [selectedSize, setSelectedSize] = useState(
    product.attributes?.sizes?.[0]?.id || null
  );
  const [cartFeedback, setCartFeedback] = useState({
    state: "idle",
    message: "",
  });

  useEffect(() => {
    setActiveImage(
      (product.images && product.images[0]) || product.thumbnailUrl
    );
    setSelectedColor(product.attributes?.colors?.[0]?.id || null);
    setSelectedSize(product.attributes?.sizes?.[0]?.id || null);
    setCartFeedback({ state: "idle", message: "" });
  }, [product]);

  const variants = product.variants || [];

  const selectedSku = useMemo(() => {
    if (!variants.length) return null;
    return (
      variants.find((variant) => {
        const attributeIds =
          variant.attributes?.map((attr) => Number(attr.id)) || [];
        const colorMatch = !selectedColor || attributeIds.includes(selectedColor);
        const sizeMatch = !selectedSize || attributeIds.includes(selectedSize);
        return colorMatch && sizeMatch;
      }) || variants[0]
    );
  }, [variants, selectedColor, selectedSize]);

  const currentPriceLabel = selectedSku
    ? Number(selectedSku.price).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      })
    : getPriceLabel(product.priceRange);

  const recommendations = product.recommendations || [];
  const reviews = product.reviews || REVIEW_TEMPLATE;
  const summary = reviews.summary || REVIEW_TEMPLATE.summary;
  const distribution = summary.distribution || REVIEW_TEMPLATE.summary.distribution;
  const reviewItems = reviews.items || [];

  const handleAddToCart = async () => {
    if (!selectedSku) return;
    setCartFeedback({ state: "loading", message: "Đang thêm vào giỏ..." });
    try {
      const response = await fetch("/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skuId: selectedSku.id, quantity: 1 }),
      });
      if (!response.ok) throw new Error("Network error");
      const payload = await response.json();
      if (!payload.success) {
        throw new Error(payload.message || "Unable to add");
      }
      setCartFeedback({ state: "success", message: "Đã thêm vào giỏ hàng." });
    } catch (error) {
      setCartFeedback({
        state: "error",
        message: "Không thể thêm sản phẩm vào giỏ.",
      });
    } finally {
      setTimeout(() => {
        setCartFeedback({ state: "idle", message: "" });
      }, 2500);
    }
  };

  return (
    <div className="product-modal-overlay" role="dialog" aria-modal="true">
      <div className="product-modal">
        <button className="product-modal__close" onClick={onClose}>
          ×
        </button>
        <div className="product-modal__body">
          <section className="product-modal__gallery">
            <img
              src={
                activeImage ||
                product.thumbnailUrl ||
                "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80"
              }
              alt={product.name}
              className="product-modal__image"
            />
            {product.images && product.images.length > 1 && (
              <div className="product-modal__thumbs">
                {product.images.map((img, index) => (
                  <div
                    key={`${img}-${index}`}
                    className={`product-modal__thumb ${
                      img === activeImage ? "active" : ""
                    }`}
                    onClick={() => setActiveImage(img)}
                  >
                    <img src={img} alt={`thumb-${index}`} />
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="product-modal__info">
            {product.categories && product.categories.length > 0 && (
              <small className="text-muted text-uppercase" style={{ letterSpacing: "0.3em" }}>
                {product.categories.map((category) => category.name).join(" / ")}
              </small>
            )}
            <h3 className="mt-2">{product.name}</h3>
            <div className="product-modal__price">{currentPriceLabel}</div>
            {product.description && (
              <p className="text-muted mt-2">{product.description}</p>
            )}

            {product.attributes?.colors?.length > 0 && (
              <div className="mt-3">
                <p className="text-uppercase text-muted mb-2" style={{ letterSpacing: "0.3em" }}>
                  Color
                </p>
                <div className="swatch-row">
                  {product.attributes.colors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={`swatch-pill ${
                        selectedColor === color.id ? "active" : ""
                      }`}
                      style={{ background: getSwatchHex(color.label) }}
                      onClick={() => setSelectedColor(color.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.attributes?.sizes?.length > 0 && (
              <div className="mt-4">
                <p className="text-uppercase text-muted mb-2" style={{ letterSpacing: "0.3em" }}>
                  Size
                </p>
                <div className="pill-row">
                  {product.attributes.sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      className={selectedSize === size.id ? "active" : ""}
                      onClick={() => setSelectedSize(size.id)}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="product-modal__actions">
              <button
                type="button"
                className="btn btn-dark text-uppercase"
                onClick={handleAddToCart}
                disabled={!selectedSku}
              >
                Add to Bag
              </button>
              {cartFeedback.message && (
                <span className="cart-feedback text-muted">
                  {cartFeedback.message}
                </span>
              )}
            </div>
          </section>
        </div>

        {recommendations.length > 0 && (
          <section className="product-modal__related">
            <h5 className="text-uppercase text-muted" style={{ letterSpacing: "0.3em" }}>
              You Might Also Like
            </h5>
            <div className="product-modal__related-grid">
              {recommendations.map((rec) => (
                <div
                  className="related-card"
                  key={rec.id}
                  onClick={() => onSelectProduct(rec.id)}
                >
                  <img
                    src={
                      rec.thumbnailUrl ||
                      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80"
                    }
                    alt={rec.name}
                  />
                  <h6>{rec.name}</h6>
                  <p className="px-3 pb-3 text-muted">
                    {getPriceLabel(rec.priceRange)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="review-section">
          <h5 className="text-uppercase text-muted mb-3" style={{ letterSpacing: "0.3em" }}>
            Reviews
          </h5>
          <div className="review-summary">
            <div>
              <div className="review-score">
                {summary.averageRating?.toFixed(1) || "0.0"}
              </div>
              <p className="text-muted">
                Based on {summary.totalReviews || 0} reviews
              </p>
            </div>
            <div className="review-bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const percent = summary.totalReviews
                  ? (count / summary.totalReviews) * 100
                  : 0;
                return (
                  <div className="review-bar" key={star}>
                    <span>{star}★</span>
                    <div className="review-bar-track">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <small>{count}</small>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="review-list">
            {reviewItems.length === 0 && (
              <p className="text-muted">Chưa có đánh giá nào cho sản phẩm này.</p>
            )}
            {reviewItems.map((item) => (
              <div className="review-card" key={item.id}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>{item.author}</strong>
                  <span>{item.rating}★</span>
                </div>
                <p className="mb-1">{item.comment || "Không có nội dung."}</p>
                {item.createdAt && (
                  <small className="text-muted">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </small>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const mountProductListing = () => {
  const container = document.getElementById("product-root");
  if (!container || !window.ReactDOM || !window.React) return;
  const categories =
    (window.__PRODUCT_LISTING__ && window.__PRODUCT_LISTING__.categories) || [];
  const root = ReactDOM.createRoot(container);
  root.render(<ProductListing initialCategories={categories} />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountProductListing);
} else {
  mountProductListing();
}

