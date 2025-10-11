import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import supabase from "../../../SupabaseClient";
import { toast } from "react-toastify";
import FileValidationService from "../../../utils/fileValidationService";
import ProductImageService from "../../../utils/productImageService";
import StorageOrganizationService from "../../../utils/storageOrganizationService";
import {
  Trash2,
  Edit,
  Image,
  Plus,
  X,
  Search,
  Package,
  DollarSign,
  TrendingUp,
  SortAsc,
} from "lucide-react";
import "./ManageProducts.css";
const BUCKET_NAME = "Products";

const ProductsManager = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    description: "",
    fullDescription: "",
    price: "",
    profit: "",
    images: [],
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showForm, setShowForm] = useState(false);

  // Fetch all products from Supabase
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("Products")
      .select("*")
      .order("id");
    if (error) toast.error(error.message);
    else setProducts(data || []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and sort products
  const filteredProducts = products
    .filter(
      (p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name-asc")
        return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name-desc")
        return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "profit-asc") return (a.profit || 0) - (b.profit || 0);
      if (sortBy === "profit-desc") return (b.profit || 0) - (a.profit || 0);
      if (sortBy === "date-newest")
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === "date-oldest")
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      return 0;
    });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Handle file input (multiple images) with validation
  const handleFilesChange = (e) => {
    const files = e.target.files;

    if (!files || files.length === 0) {
      setImageFiles([]);
      return;
    }

    const validation = FileValidationService.validateFiles(files);

    if (validation.errors.length > 0) {
      FileValidationService.showValidationErrors(validation.errors, toast);
    }

    if (validation.validFiles.length > 0) {
      FileValidationService.showValidationSuccess(
        validation.validCount,
        validation.totalSize,
        toast
      );
      setImageFiles(validation.validFiles);
    } else {
      setImageFiles([]);
      e.target.value = ""; // Clear input if no valid files
    }
  };

  // Upload all selected images to Supabase Storage with organized folder structure
  const uploadImages = async () => {
    if (!imageFiles.length) return [];

    try {
      // Uploading images for product

      const uploadResult = await StorageOrganizationService.uploadProductImages(
        imageFiles,
        form.name
      );

      if (!uploadResult.success) {
        toast.error(
          `Failed to upload images: ${uploadResult.errors.join(", ")}`
        );
        return [];
      }

      toast.success(`✅ Uploaded ${uploadResult.urls.length} product images`);
      // Product images uploaded with organized storage

      return uploadResult.urls;
    } catch (error) {
      // Error uploading product images
      toast.error(`Failed to upload images: ${error.message}`);
      return [];
    }
  };

  // Create or Update product in Supabase
  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      toast.error(t("manageProducts.fillRequiredFields"));
      return;
    }

    setLoading(true);

    try {
      const newImageURLs = await uploadImages();
      const finalImages = [...form.images, ...newImageURLs];

      const payload = {
        name: form.name,
        description: form.description,
        fullDescription: form.fullDescription,
        price: Number(form.price),
        profit: Number(form.profit) || 0,
        images: finalImages,
      };

      if (form.id) {
        const { error } = await supabase
          .from("Products")
          .update(payload)
          .eq("id", form.id);

        if (error) throw error;
        toast.success("✅ Product updated!");
      } else {
        const { error } = await supabase.from("Products").insert([payload]);

        if (error) throw error;
        toast.success("✅ Product added!");
      }

      fetchProducts();
      resetForm();
      setShowForm(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete product from Supabase with image cleanup
  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      // Find the product to get its images
      const product = products.find((p) => p.id === productId);

      if (!product) {
        toast.error(t("manageProducts.productNotFound"));
        return;
      }

      // Delete images from storage first
      if (product.images && product.images.length > 0) {
        // Deleting images for product

        const imageDeletionResult =
          await ProductImageService.deleteProductImages(product);

        if (imageDeletionResult.success) {
          toast.success(
            `✅ Deleted ${imageDeletionResult.totalDeleted} product images`
          );
        } else {
          const message =
            imageDeletionResult.totalSkipped > 0
              ? `⚠️ Deleted ${imageDeletionResult.totalDeleted} images, ${imageDeletionResult.totalSkipped} skipped, ${imageDeletionResult.errors.length} failed`
              : `⚠️ Deleted ${imageDeletionResult.totalDeleted} images, ${imageDeletionResult.errors.length} failed`;

          toast.warning(message);
          // Image deletion errors handled silently
          if (imageDeletionResult.skippedUrls.length > 0) {
            // Skipped URLs handled silently
          }
        }
      }

      // Delete product from database
      const { error } = await supabase
        .from("Products")
        .delete()
        .eq("id", productId);

      if (error) {
        toast.error(`Failed to delete product: ${error.message}`);
        return;
      }

      toast.success("🗑️ Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      toast.error(`Failed to delete product: ${error.message}`);
    }
  };

  // Edit product
  const handleEdit = (product) => {
    setForm(product);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Remove image from form and storage
  const removeImage = async (index) => {
    const imageToRemove = form.images[index];

    if (imageToRemove) {
      // Delete from storage
      try {
        const deleteResult = await ProductImageService.deleteProductImage(
          imageToRemove
        );

        if (deleteResult.success) {
          toast.success(`✅ Removed image: ${deleteResult.fileName}`);
        } else {
          toast.warning(
            `⚠️ Failed to delete image from storage: ${deleteResult.error}`
          );
        }
      } catch (error) {
        // Error deleting image
        toast.warning("⚠️ Failed to delete image from storage");
      }
    }

    // Remove from form
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  // Reset form
  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      description: "",
      fullDescription: "",
      price: "",
      profit: "",
      images: [],
    });
    setImageFiles([]);
  };

  // Calculate statistics
  const totalValue = products.reduce(
    (sum, p) => sum + (Number(p.price) || 0),
    0
  );
  const totalProfit = products.reduce(
    (sum, p) => sum + (Number(p.profit) || 0),
    0
  );

  return (
    <div className="products-manager">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-main">
            <div className="header-left">
              <div className="header-title">
                <Package size={36} style={{ color: "var(--blue-600)" }} />
                <div>
                  <h1>{t("manageProducts.title")}</h1>
                  <p className="header-subtitle">
                    {t("manageProducts.subtitle")}
                  </p>
                </div>
              </div>
            </div>
            <div className="header-actions">
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(!showForm);
                }}
                className="manage-products-btn manage-products-btn-primary"
              >
                <Plus size={20} />
                {showForm ? t("common.cancel") : t("manageProducts.addProduct")}
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="stats-container">
            <div className="stat-card stat-card-blue">
              <div className="stat-content">
                <div className="stat-icon stat-icon-blue">
                  <Package size={28} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">
                    {t("manageProducts.totalProducts")}
                  </p>
                  <p className="stat-value">{products.length}</p>
                </div>
              </div>
            </div>

            <div className="stat-card stat-card-green">
              <div className="stat-content">
                <div className="stat-icon stat-icon-green">
                  <DollarSign size={28} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">{t("manageProducts.totalValue")}</p>
                  <p className="stat-value">{totalValue.toFixed(2)} EGP</p>
                </div>
              </div>
            </div>

            <div className="stat-card stat-card-purple">
              <div className="stat-content">
                <div className="stat-icon stat-icon-purple">
                  <TrendingUp size={28} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">
                    {t("manageProducts.totalProfit")}
                  </p>
                  <p className="stat-value">{totalProfit.toFixed(2)} EGP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="content-wrapper">
          {/* Sidebar */}
          <aside className="sidebar">
            {/* Search */}
            <div className="sidebar-section">
              <h3 className="sidebar-title">
                <Search size={16} />
                {t("common.search")}
              </h3>
              <div className="search-box">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder={t("manageProducts.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="sidebar-section">
              <h3 className="sidebar-title">
                <SortAsc size={16} />
                {t("manageProducts.sortBy")}
              </h3>
              <div className="filter-group">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="name-asc">
                    {t("manageProducts.nameAsc")}
                  </option>
                  <option value="name-desc">
                    {t("manageProducts.nameDesc")}
                  </option>
                  <option value="price-asc">
                    {t("manageProducts.priceAsc")}
                  </option>
                  <option value="price-desc">
                    {t("manageProducts.priceDesc")}
                  </option>
                  <option value="profit-asc">
                    {t("manageProducts.profitAsc")}
                  </option>
                  <option value="profit-desc">
                    {t("manageProducts.profitDesc")}
                  </option>
                  <option value="date-newest">
                    {t("manageProducts.dateNewest")}
                  </option>
                  <option value="date-oldest">
                    {t("manageProducts.dateOldest")}
                  </option>
                </select>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            {/* Form */}
            {showForm && (
              <div className="form-card">
                <div className="form-header">
                  <h2 className="form-title">
                    {form.id
                      ? t("manageProducts.editProduct")
                      : t("manageProducts.addNewProduct")}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="manage-products-close-btn"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      {t("manageProducts.productName")} *
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder={t("manageProducts.enterProductName")}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("manageProducts.price")} (EGP) *
                    </label>
                    <input
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="form-input"
                      type="number"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("manageProducts.profit")} (EGP)
                    </label>
                    <input
                      name="profit"
                      value={form.profit}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="form-input"
                      type="number"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("manageProducts.shortDescription")}
                    </label>
                    <input
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder={t("manageProducts.briefDescription")}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("manageProducts.fullDescription")}
                  </label>
                  <textarea
                    name="fullDescription"
                    value={form.fullDescription}
                    onChange={handleChange}
                    placeholder={t("manageProducts.detailedDescription")}
                    className="form-textarea"
                    rows="4"
                  />
                </div>

                <div className="file-input-wrapper">
                  <label className="form-label">
                    {t("manageProducts.productImages")}
                  </label>
                  <div className="file-input-info">
                    <span className="file-size-limit">
                      {FileValidationService.getSizeLimitMessage()}
                    </span>
                    <span className="file-types-info">
                      {FileValidationService.getSupportedTypesMessage()}
                    </span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFilesChange}
                    className="file-input"
                  />

                  {form.images.length > 0 && (
                    <div className="image-preview-grid">
                      {form.images.map((img, i) => (
                        <div key={i} className="image-preview-item">
                          <img src={img} alt={`Preview ${i}`} />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="image-remove-btn"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`manage-products-btn ${
                      loading
                        ? "manage-products-btn-secondary"
                        : "manage-products-btn-success"
                    }`}
                  >
                    {loading
                      ? t("manageProducts.processing")
                      : form.id
                      ? t("manageProducts.updateProduct")
                      : t("manageProducts.addProduct")}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="manage-products-btn manage-products-btn-secondary"
                  >
                    {t("manageProducts.clearForm")}
                  </button>
                </div>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="product-card">
                    {product.images?.length > 0 && (
                      <div className="product-image">
                        <img src={product.images[0]} alt={product.name} />
                      </div>
                    )}

                    <div className="product-content">
                      <h3 className="product-title">{product.name}</h3>
                      <p className="product-description">
                        {product.description ||
                          t("manageProducts.noDescriptionAvailable")}
                      </p>

                      <div className="product-details">
                        <div className="product-detail-row">
                          <span className="product-detail-label">
                            {t("manageProducts.price")}:
                          </span>
                          <span className="product-price">
                            {Number(product.price).toFixed(2)} EGP
                          </span>
                        </div>
                        <div className="product-detail-row">
                          <span className="product-detail-label">
                            {t("manageProducts.profit")}:
                          </span>
                          <span className="product-profit">
                            {Number(product.profit || 0).toFixed(2)} EGP
                          </span>
                        </div>
                      </div>

                      <div className="product-actions">
                        <button
                          className="manage-products-btn manage-products-btn-edit"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          className="manage-products-btn manage-products-btn-delete"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                        {product.images?.length > 0 && (
                          <button
                            className="manage-products-btn manage-products-btn-images"
                            onClick={() => setPreviewImages(product.images)}
                          >
                            <Image size={16} />
                            <span className="image-count-badge">
                              {product.images.length}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Package size={64} className="empty-icon" />
                <h3>No products found</h3>
                <p>
                  Try adjusting your search or filters, or add a new product to
                  get started
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImages && (
        <div className="modal-overlay" onClick={() => setPreviewImages(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Product Images</h3>
              <button
                onClick={() => setPreviewImages(false)}
                className="modal-close"
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal-images-grid">
              {previewImages.map((img, i) => (
                <img key={i} src={img} alt={`Product ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;
