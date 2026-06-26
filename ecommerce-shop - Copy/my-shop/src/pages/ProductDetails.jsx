import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProduct, getProducts } from "../services/api";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        const [productData, allProducts] = await Promise.all([
          getProduct(id),
          getProducts(),
        ]);

        if (cancelled) return;

        setProduct(productData);
        setRecommendations(
          allProducts.filter(
            (item) =>
              item.category === productData.category &&
              item.id !== productData.id
          )
        );
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="p-10 text-center">Loading product...</p>;
  }

  if (error || !product) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <button
          onClick={() => navigate("/")}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-10">

      <button
        onClick={() => navigate("/")}
        className="mb-6 bg-black text-white px-4 py-2 rounded"
      >
        Back
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-[500px] object-contain"
        />

        <div>
          <h1 className="text-4xl font-bold">
            {product.name}
          </h1>

          <p className="text-2xl text-red-600 mt-4">
            ${product.price.toFixed(2)}
          </p>

          <button className="mt-6 bg-black text-white px-6 py-3 rounded">
            Add To Cart
          </button>
        </div>
      </div>

      <h2 className="text-3xl font-bold mt-16 mb-8">
        Recommended Products
      </h2>

      <div className="grid grid-cols-4 gap-6">
        {recommendations.map(item => (
          <div
            key={item.id}
            className="border rounded-lg p-4 cursor-pointer"
            onClick={() => navigate(`/product/${item.id}`)}
          >
            <img
              src={item.image}
              alt={item.name}
              className="h-40 mx-auto"
            />

            <h3 className="mt-3 font-semibold">
              {item.name}
            </h3>

            <p>${item.price.toFixed(2)}</p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ProductDetails;
