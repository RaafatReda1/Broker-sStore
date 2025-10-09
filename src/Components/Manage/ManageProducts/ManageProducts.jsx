import React, { useEffect, useState } from "react";
import supabase from "../../../SupabaseClient";
import { toast } from "react-toastify";
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

  // Handle file input (multiple images)
  const handleFilesChange = (e) => {
    setImageFiles([...e.target.files]);
  };

  // Upload all selected images to Supabase Storage
  const uploadImages = async () => {
    if (!imageFiles.length) return [];

    const uploadedURLs = [];

    for (const file of imageFiles) {
      const fileExt = file.name.split(".").pop();
      const uniqueName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueName, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uniqueName);
      uploadedURLs.push(publicUrl);
    }

    return uploadedURLs;
  };

  // Create or Update product in Supabase
  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      toast.error("Please fill in required fields");
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

  // Delete product from Supabase
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    const { error } = await supabase.from("Products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("🗑️ Product deleted!");
      fetchProducts();
    }
  };

  // Edit product
  const handleEdit = (product) => {
    setForm(product);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Remove image from form
  const removeImage = (index) => {
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
                  <h1>Products Manager</h1>
                  <p className="header-subtitle">
                    Manage your product inventory efficiently
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
                {showForm ? "Cancel" : "Add Product"}
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
                  <p className="stat-label">Total Products</p>
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
                  <p className="stat-label">Total Value</p>
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
                  <p className="stat-label">Total Profit</p>
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
                Search
              </h3>
              <div className="search-box">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
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
                Sort By
              </h3>
              <div className="filter-group">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="profit-asc">Profit (Low to High)</option>
                  <option value="profit-desc">Profit (High to Low)</option>
                  <option value="date-newest">Date (Newest First)</option>
                  <option value="date-oldest">Date (Oldest First)</option>
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
                    {form.id ? "Edit Product" : "Add New Product"}
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
                    <label className="form-label">Product Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (EGP) *</label>
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
                    <label className="form-label">Profit (EGP)</label>
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
                    <label className="form-label">Short Description</label>
                    <input
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Brief description"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Description</label>
                  <textarea
                    name="fullDescription"
                    value={form.fullDescription}
                    onChange={handleChange}
                    placeholder="Detailed product description..."
                    className="form-textarea"
                    rows="4"
                  />
                </div>

                <div className="file-input-wrapper">
                  <label className="form-label">Product Images</label>
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
                      ? "Processing..."
                      : form.id
                      ? "Update Product"
                      : "Add Product"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="manage-products-btn manage-products-btn-secondary"
                  >
                    Clear Form
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
                        {product.description || "No description available"}
                      </p>

                      <div className="product-details">
                        <div className="product-detail-row">
                          <span className="product-detail-label">Price:</span>
                          <span className="product-price">
                            {Number(product.price).toFixed(2)} EGP
                          </span>
                        </div>
                        <div className="product-detail-row">
                          <span className="product-detail-label">Profit:</span>
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
