const { useCallback, useEffect, useMemo, useState } = React;

const InventoryMatrix = ({ productId }) => {
  const [state, setState] = useState({
    loading: true,
    saving: false,
    error: null,
    success: null,
    colors: [],
    sizes: [],
    matrix: {},
    skuKeyIndex: {},
    variantType: 'clothing', // clothing, accessory, shoes, simple
  });

  const fetchMatrix = useCallback(async () => {
    if (!productId) return;
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      success: null,
    }));
    try {
      const response = await axios.get(
        `/api/products/${productId}/stock-matrix`
      );
      const payload = response.data?.data || response.data || {};
      const colors = payload.colors || [];
      const sizes = payload.sizes || [];
      const matrix = {};
      const skuKeyIndex = {};
      
      // Xác định loại sản phẩm
      let variantType = 'simple';
      const hasColors = colors.length > 0;
      const hasSizes = sizes.length > 0;
      
      if (hasColors && hasSizes) {
        variantType = 'clothing';
      } else if (hasColors && !hasSizes) {
        variantType = 'accessory';
      } else if (!hasColors && hasSizes) {
        variantType = 'shoes';
      }
      
      (payload.cells || []).forEach((cell) => {
        const key = `${cell.colorId || 'null'}-${cell.sizeId || 'null'}`;
        matrix[key] = {
          ...cell,
          value: Number.isFinite(Number(cell.quantity))
            ? Number(cell.quantity)
            : 0,
        };
        if (cell.skuId) {
          skuKeyIndex[cell.skuId] = key;
        }
      });

      setState({
        loading: false,
        saving: false,
        error: null,
        success: null,
        colors,
        sizes,
        matrix,
        skuKeyIndex,
        variantType,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Không thể tải dữ liệu tồn kho.",
      }));
    }
  }, [productId]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const hasDirtyChanges = useMemo(
    () =>
      Object.values(state.matrix).some(
        (cell) =>
          cell?.skuId && Number(cell.value) !== Number(cell.quantity || 0)
      ),
    [state.matrix]
  );

  const handleCellChange = (key, nextValue) => {
    setState((prev) => {
      const cell = prev.matrix[key];
      if (!cell || !cell.skuId) return prev;
      const numericValue = Number(nextValue);
      const normalized =
        Number.isNaN(numericValue) || numericValue < 0
          ? 0
          : Math.floor(numericValue);
      if (normalized === cell.value) {
        return prev;
      }
      return {
        ...prev,
        success: null,
        matrix: {
          ...prev.matrix,
          [key]: {
            ...cell,
            value: normalized,
          },
        },
      };
    });
  };

  const handleSave = async () => {
    const updates = Object.values(state.matrix)
      .filter(
        (cell) =>
          cell?.skuId && Number(cell.value) !== Number(cell.quantity || 0)
      )
      .map((cell) => ({
        skuId: cell.skuId,
        quantity: Number(cell.value) || 0,
      }));

    if (!updates.length) {
      setState((prev) => ({
        ...prev,
        success: "Không có thay đổi cần lưu.",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      success: null,
    }));

    try {
      await axios.put(`/api/products/${productId}/stock-matrix`, {
        updates,
      });
      setState((prev) => {
        const nextMatrix = { ...prev.matrix };
        updates.forEach(({ skuId, quantity }) => {
          const cellKey = prev.skuKeyIndex[skuId];
          if (cellKey && nextMatrix[cellKey]) {
            nextMatrix[cellKey] = {
              ...nextMatrix[cellKey],
              quantity,
              value: quantity,
            };
          }
        });
        return {
          ...prev,
          saving: false,
          success: "Đã lưu tồn kho.",
          matrix: nextMatrix,
        };
      });
    } catch (error) {
      const message =
        error?.response?.data?.message || "Không thể lưu tồn kho.";
      setState((prev) => ({
        ...prev,
        saving: false,
        error: message,
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="text-muted py-4 text-center">Đang tải tồn kho...</div>
    );
  }

  const hasVariants = state.colors.length > 0 || state.sizes.length > 0 || Object.keys(state.matrix).length > 0;
  
  if (!hasVariants) {
    return (
      <div className="alert alert-warning mb-0">
        Sản phẩm này chưa có biến thể để quản lý tồn kho.
      </div>
    );
  }

  // Style để ẩn spinners trên input number
  const inputStyle = {
    MozAppearance: 'textfield',
    WebkitAppearance: 'none',
    appearance: 'textfield',
  };

  // Sắp xếp sizes theo thứ tự chuẩn
  const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL'];
  const sortedSizes = [...state.sizes].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.label);
    const indexB = SIZE_ORDER.indexOf(b.label);
    if (indexA === -1 && indexB === -1) {
      // Số size giày
      const numA = parseInt(a.label);
      const numB = parseInt(b.label);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.label.localeCompare(b.label);
    }
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Render theo loại sản phẩm
  const renderClothingMatrix = () => (
    <div className="table-responsive">
      <table className="table table-bordered align-middle text-center">
        <thead className="table-light">
          <tr>
            <th style={{ minWidth: "120px" }}>Màu / Size</th>
            {sortedSizes.map((size) => (
              <th key={size.id}>{size.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {state.colors.map((color) => (
            <tr key={color.id}>
              <th className="text-start">{color.label}</th>
              {sortedSizes.map((size) => {
                const key = `${color.id}-${size.id}`;
                const cell = state.matrix[key];
                const hasSku = cell && cell.skuId;
                const displayValue = hasSku ? cell.value : 0;
                
                return (
                  <td key={key}>
                    <input
                      type="number"
                      min="0"
                      className={`form-control form-control-sm text-center stock-input ${!hasSku ? 'text-muted bg-light' : ''}`}
                      style={inputStyle}
                      value={displayValue}
                      onChange={(event) =>
                        handleCellChange(key, event.target.value)
                      }
                      disabled={state.saving || !hasSku}
                      title={!hasSku ? 'Chưa có biến thể này trong kho' : ''}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAccessoryList = () => (
    <div className="table-responsive">
      <table className="table table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th>Màu sắc</th>
            <th style={{ width: "150px" }} className="text-center">Số lượng</th>
          </tr>
        </thead>
        <tbody>
          {state.colors.map((color) => {
            const key = `${color.id}-null`;
            const cell = state.matrix[key];
            const hasSku = cell && cell.skuId;
            const displayValue = hasSku ? cell.value : 0;
            
            return (
              <tr key={color.id}>
                <td>
                  <span className="fw-semibold">{color.label}</span>
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    className={`form-control form-control-sm text-center stock-input ${!hasSku ? 'text-muted bg-light' : ''}`}
                    style={inputStyle}
                    value={displayValue}
                    onChange={(event) =>
                      handleCellChange(key, event.target.value)
                    }
                    disabled={state.saving || !hasSku}
                    title={!hasSku ? 'Chưa có biến thể này trong kho' : ''}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderShoesList = () => (
    <div className="table-responsive">
      <table className="table table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th>Kích thước</th>
            <th style={{ width: "150px" }} className="text-center">Số lượng</th>
          </tr>
        </thead>
        <tbody>
          {sortedSizes.map((size) => {
            const key = `null-${size.id}`;
            const cell = state.matrix[key];
            const hasSku = cell && cell.skuId;
            const displayValue = hasSku ? cell.value : 0;
            
            return (
              <tr key={size.id}>
                <td>
                  <span className="badge bg-light text-dark" style={{ fontSize: '14px', padding: '8px 16px' }}>
                    Size {size.label}
                  </span>
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    className={`form-control form-control-sm text-center stock-input ${!hasSku ? 'text-muted bg-light' : ''}`}
                    style={inputStyle}
                    value={displayValue}
                    onChange={(event) =>
                      handleCellChange(key, event.target.value)
                    }
                    disabled={state.saving || !hasSku}
                    title={!hasSku ? 'Chưa có biến thể này trong kho' : ''}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderSimpleStock = () => {
    const key = 'null-null';
    const cell = state.matrix[key] || Object.values(state.matrix)[0];
    const hasSku = cell && cell.skuId;
    const displayValue = hasSku ? cell.value : 0;
    const actualKey = cell ? `${cell.colorId || 'null'}-${cell.sizeId || 'null'}` : key;
    
    return (
      <div className="d-flex align-items-center gap-3">
        <label className="fw-semibold mb-0">Số lượng tồn kho:</label>
        <input
          type="number"
          min="0"
          className={`form-control form-control-sm stock-input ${!hasSku ? 'text-muted bg-light' : ''}`}
          style={{ ...inputStyle, width: '120px' }}
          value={displayValue}
          onChange={(event) =>
            handleCellChange(actualKey, event.target.value)
          }
          disabled={state.saving || !hasSku}
        />
      </div>
    );
  };

  return (
    <div>
      {/* CSS để ẩn spinners cho Chrome, Safari, Edge, Opera */}
      <style>{`
        .stock-input::-webkit-outer-spin-button,
        .stock-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .stock-input {
          -moz-appearance: textfield;
        }
      `}</style>

      {state.error ? (
        <div className="alert alert-danger">{state.error}</div>
      ) : null}
      {state.success ? (
        <div className="alert alert-success">{state.success}</div>
      ) : null}

      {state.variantType === 'clothing' && renderClothingMatrix()}
      {state.variantType === 'accessory' && renderAccessoryList()}
      {state.variantType === 'shoes' && renderShoesList()}
      {state.variantType === 'simple' && renderSimpleStock()}

      <div className="d-flex flex-column flex-md-row gap-2 mt-3">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={fetchMatrix}
          disabled={state.loading || state.saving}
        >
          Tải lại
        </button>
        <button
          type="button"
          className="btn btn-dark"
          onClick={handleSave}
          disabled={!hasDirtyChanges || state.saving}
        >
          {state.saving ? "Đang lưu..." : "Lưu tồn kho"}
        </button>
      </div>
    </div>
  );
};

const mountInventoryMatrix = () => {
  const container = document.getElementById("inventory-matrix-root");
  if (!container || !window.ReactDOM || !window.React) return;
  const productId = container.dataset.productId;
  if (!productId) return;
  const root = ReactDOM.createRoot(container);
  root.render(<InventoryMatrix productId={productId} />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountInventoryMatrix);
} else {
  mountInventoryMatrix();
}

