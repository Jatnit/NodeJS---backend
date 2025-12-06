import { Category } from "../models";
import cloudinaryService from "../service/cloudinaryService";
import { logCreate, logUpdate, logDelete } from "../service/auditLogger";

const ensureAdmin = (req, res) => {
  if (!req.session || !req.session.user) {
    res.redirect("/signin");
    return true;
  }
  const roleId = String(req.session.user.roleId);
  // Allow Super Admin (0) and Admin (1)
  if (roleId !== "0" && roleId !== "1") {
    res.redirect("/admin/dashboard?status=forbidden");
    return true;
  }
  return false;
};

const normalizeSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-");

const renderView = async (req, res, options = {}) => {
  const categories = await Category.findAll({
    order: [
      ["parentId", "ASC"],
      ["name", "ASC"],
    ],
    raw: true,
  });

  return res.render("admin/categories.ejs", {
    categories,
    editingCategory: options.editingCategory || null,
    errorMessage: options.errorMessage || null,
    formData: options.formData || null,
    successMessage: options.successMessage || null,
    currentUser: req.session?.user || null,
    theme: req.session?.theme || "light",
  });
};

const listCategories = async (req, res) => {
  if (ensureAdmin(req, res)) return;
  const { status } = req.query;
  let successMessage = null;
  if (status === "created") successMessage = "Tạo danh mục thành công.";
  if (status === "updated") successMessage = "Cập nhật danh mục thành công.";
  if (status === "deleted") successMessage = "Đã xóa danh mục.";
  return renderView(req, res, { successMessage });
};

const renderEditCategory = async (req, res) => {
  if (ensureAdmin(req, res)) return;
  const { id } = req.params;
  const category = await Category.findByPk(id, { raw: true });
  if (!category) {
    return res.redirect("/admin/categories?status=notfound");
  }
  return renderView(req, res, { editingCategory: category });
};

const createCategory = async (req, res) => {
  if (ensureAdmin(req, res)) return;
  const { name, slug, parentId } = req.body;
  if (!name || !name.trim()) {
    return renderView(req, res, {
      errorMessage: "Vui lòng nhập tên danh mục.",
      formData: { name, slug, parentId },
    });
  }

  try {
    let imageUrl = null;
    if (req.file && req.file.buffer) {
      const upload = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: "moda-studio/categories",
      });
      imageUrl = upload?.secure_url || null;
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug && slug.trim() ? slug.trim() : normalizeSlug(name),
      parentId: parentId ? Number(parentId) : null,
      imageUrl,
    });

    // Log category creation
    logCreate(req, "categories", category.id, {
      name: category.name,
      slug: category.slug,
    });

    return res.redirect("/admin/categories?status=created");
  } catch (error) {
    console.log("createCategory error:", error);
    return renderView(req, res, {
      errorMessage: "Không thể tạo danh mục.",
      formData: { name, slug, parentId },
    });
  }
};

const updateCategory = async (req, res) => {
  if (ensureAdmin(req, res)) return;
  const { id } = req.params;
  const { name, slug, parentId } = req.body;
  const category = await Category.findByPk(id);

  if (!category) {
    return res.redirect("/admin/categories?status=notfound");
  }

  // Store old data for audit log
  const oldData = {
    name: category.name,
    slug: category.slug,
    parentId: category.parentId,
  };

  try {
    let imageUrl = category.imageUrl;
    if (req.file && req.file.buffer) {
      const upload = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: "moda-studio/categories",
      });
      imageUrl = upload?.secure_url || imageUrl;
    }

    const newName = name && name.trim() ? name.trim() : category.name;
    const newSlug =
      slug && slug.trim()
        ? slug.trim()
        : category.slug || normalizeSlug(name || category.name);
    const newParentId =
      parentId && Number(parentId) !== Number(id) ? Number(parentId) : null;

    await category.update({
      name: newName,
      slug: newSlug,
      parentId: newParentId,
      imageUrl,
    });

    // Log category update
    logUpdate(req, "categories", id, oldData, {
      name: newName,
      slug: newSlug,
      parentId: newParentId,
    });

    return res.redirect("/admin/categories?status=updated");
  } catch (error) {
    console.log("updateCategory error:", error);
    return renderView(req, res, {
      editingCategory: {
        id,
        name,
        slug,
        parentId,
        imageUrl: category.imageUrl,
      },
      errorMessage: "Không thể cập nhật danh mục.",
    });
  }
};

const deleteCategory = async (req, res) => {
  if (ensureAdmin(req, res)) return;
  const { id } = req.params;
  try {
    // Get category data before deletion for audit log
    const category = await Category.findByPk(id, { raw: true });

    await Category.destroy({ where: { id } });

    // Log category deletion
    if (category) {
      logDelete(req, "categories", id, {
        name: category.name,
        slug: category.slug,
      });
    }

    return res.redirect("/admin/categories?status=deleted");
  } catch (error) {
    console.log("deleteCategory error:", error);
    return res.redirect("/admin/categories?status=error");
  }
};

export default {
  listCategories,
  renderEditCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
