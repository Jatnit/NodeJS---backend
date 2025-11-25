import { Category } from "../models";
import cloudinaryService from "../service/cloudinaryService";

const ensureAdmin = (req, res) => {
  const isAdmin =
    req.session && req.session.user && String(req.session.user.roleId) === "1";
  if (!isAdmin) {
    return res.redirect("/signin");
  }
  return null;
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

    await Category.create({
      name: name.trim(),
      slug: slug && slug.trim() ? slug.trim() : normalizeSlug(name),
      parentId: parentId ? Number(parentId) : null,
      imageUrl,
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

  try {
    let imageUrl = category.imageUrl;
    if (req.file && req.file.buffer) {
      const upload = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: "moda-studio/categories",
      });
      imageUrl = upload?.secure_url || imageUrl;
    }

    await category.update({
      name: name && name.trim() ? name.trim() : category.name,
      slug:
        slug && slug.trim()
          ? slug.trim()
          : category.slug || normalizeSlug(name || category.name),
      parentId:
        parentId && Number(parentId) !== Number(id) ? Number(parentId) : null,
      imageUrl,
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
    await Category.destroy({ where: { id } });
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
