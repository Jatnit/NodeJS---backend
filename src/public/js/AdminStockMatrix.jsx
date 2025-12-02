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
      (payload.cells || []).forEach((cell) => {
        const key = `${cell.colorId}-${cell.sizeId}`;
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

  if (!state.colors.length || !state.sizes.length) {
    return (
      <div className="alert alert-warning mb-0">
        Sản phẩm này chưa có biến thể màu hoặc size để quản lý tồn kho.
      </div>
    );
  }

  return (
    <div>
      {state.error ? (
        <div className="alert alert-danger">{state.error}</div>
      ) : null}
      {state.success ? (
        <div className="alert alert-success">{state.success}</div>
      ) : null}

      <div className="table-responsive">
        <table className="table table-bordered align-middle text-center">
          <thead className="table-light">
            <tr>
              <th style={{ minWidth: "120px" }}>Màu / Size</th>
              {state.sizes.map((size) => (
                <th key={size.id}>{size.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.colors.map((color) => (
              <tr key={color.id}>
                <th className="text-start">{color.label}</th>
                {state.sizes.map((size) => {
                  const key = `${color.id}-${size.id}`;
                  const cell = state.matrix[key];
                  if (!cell || !cell.skuId) {
                    return (
                      <td key={key} className="text-muted">
                        —
                      </td>
                    );
                  }
                  return (
                    <td key={key}>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm text-end"
                        value={cell.value}
                        onChange={(event) =>
                          handleCellChange(key, event.target.value)
                        }
                        disabled={state.saving}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

