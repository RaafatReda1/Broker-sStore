import React, { useEffect, useState } from "react";
import supabase from "../../../SupabaseClient";
import { toast } from "react-toastify";

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

  // 🔹 Fetch all products
  const fetchProducts = async () => {
    const { data, error } = await supabase.from("Products").select("*").order("id");
    if (error) toast.error(error.message);
    else setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 🔹 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 🔹 Handle file input (multiple images)
  const handleFilesChange = (e) => {
    setImageFiles([...e.target.files]);
  };

  // 🔹 Upload all selected images and return public URLs
  const uploadImages = async () => {
    if (!imageFiles.length) return [];

    const uploadedURLs = [];

    for (const file of imageFiles) {
      const fileExt = file.name.split(".").pop();
      const uniqueName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      // 🟠 Upload file to the "Products" bucket
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueName, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      // 🟢 Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uniqueName);

      uploadedURLs.push(publicUrl);
    }

    return uploadedURLs;
  };

  // 🔹 Create or Update product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload new images first
      const newImageURLs = await uploadImages();
      const finalImages = [...form.images, ...newImageURLs];

      const payload = {
        name: form.name,
        description: form.description,
        fullDescription: form.fullDescription,
        price: Number(form.price),
        profit: Number(form.profit),
        images: finalImages,
        updated_at: new Date().toISOString(),
      };

      if (form.id) {
        // 🟣 Update existing product
        const { error } = await supabase
          .from("Products")
          .update(payload)
          .eq("id", form.id);

        if (error) throw error;

        toast.success("✅ Product updated!");
      } else {
        // 🟢 Add new product
        const { error } = await supabase
          .from("Products")
          .insert([{ ...payload, created_at: new Date().toISOString() }]);

        if (error) throw error;

        toast.success("✅ Product added!");
      }

      fetchProducts();
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete product
  const handleDelete = async (id) => {
    const { error } = await supabase.from("Products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("🗑️ Product deleted!");
      fetchProducts();
    }
  };

  // 🔹 Edit product
  const handleEdit = (product) => {
    setForm(product);
  };

  // 🔹 Reset form
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

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">🛒 Products Manager</h2>

      {/* 🧾 Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 bg-gray-100 p-4 rounded-lg shadow-md"
      >
        <div className="grid grid-cols-2 gap-3">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            className="p-2 border rounded"
            required
          />
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Short Description"
            className="p-2 border rounded"
          />
          <textarea
            name="fullDescription"
            value={form.fullDescription}
            onChange={handleChange}
            placeholder="Full Description"
            className="col-span-2 p-2 border rounded"
          />
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
            className="p-2 border rounded"
            type="number"
          />
          <input
            name="profit"
            value={form.profit}
            onChange={handleChange}
            placeholder="Profit"
            className="p-2 border rounded"
            type="number"
          />
          <input
            type="file"
            multiple
            onChange={handleFilesChange}
            className="col-span-2 p-2 border rounded bg-white"
          />
        </div>

        <div className="flex justify-between">
          <button
            type="submit"
            disabled={loading}
            className={`${
              loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            } text-white px-4 py-2 rounded`}
          >
            {form.id ? "Update Product" : "Add Product"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Reset
          </button>
        </div>
      </form>

      {/* 📦 Products List */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="border p-4 rounded-lg shadow-sm bg-white flex flex-col justify-between"
          >
            <div>
              <h3 className="font-bold text-lg">{product.name}</h3>
              <p>{product.description}</p>
              <p className="text-sm text-gray-500">{product.price} EGP</p>

              {product.images?.length > 0 && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-40 object-cover mt-2 rounded"
                />
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                onClick={() => handleEdit(product)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                onClick={() => handleDelete(product.id)}
              >
                Delete
              </button>
              <button
                className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                onClick={() => setPreviewImages(product.images)}
              >
                Images
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 🖼️ Image Preview Modal */}
      {previewImages && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPreviewImages(false)}
        >
          <div
            className="bg-white rounded-lg p-4 max-w-lg w-full grid grid-cols-3 gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {previewImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Product ${i}`}
                className="rounded-lg border object-contain h-32 w-full"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;
