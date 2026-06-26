import React, { useEffect, useState } from 'react';
import { IoHeart } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { getProducts } from '../../services/api';

const Product = ({
  searchTerm,
  addToCart,
  addToWishlist,
  wishlist
}) => {

  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    'All',
    'Mens',
    'Womens',
    'Kids',
    'New Arrivals',
    'On Scale'
  ];

  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    let cancelled = false;

    getProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filterItems = products.filter(item => {

    const matchesCategory =
      activeTab === 'All' ||
      (activeTab === 'New Arrivals' && item.newArrival) ||
      (activeTab === 'On Scale' && item.onSale) ||
      activeTab === item.category;

    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <section id='product-section' className='max-w-6xl px-12 mx-auto mt-12 text-center text-lg'>
        Loading products...
      </section>
    );
  }

  if (error) {
    return (
      <section id='product-section' className='max-w-6xl px-12 mx-auto mt-12 text-center text-red-600 text-lg'>
        Failed to load products: {error}
      </section>
    );
  }

  return (
    <section
      id='product-section'
      className='max-w-6xl px-12 mx-auto'
    >

      {/* Categories */}
      <div className='flex gap-3 justify-center items-center mt-8 flex-wrap'>
        {categories.map(category => (
          <button
            key={category}
            className={`px-8 py-2 rounded-full text-lg cursor-pointer ${
              activeTab === category
                ? 'bg-linear-to-r from-indigo-500 to-teal-400 text-white'
                : 'bg-zinc-100'
            }`}
            onClick={() => setActiveTab(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className='grid grid-cols-4 gap-9 mt-12'>

        {filterItems.length === 0 ? (
          <p className='text-center col-span-4 text-zinc-800 text-lg'>
            No Product found
          </p>
        ) : (

          filterItems.map(product => (

            <div
              key={product.id}
              className='bg-zinc-100 p-5 border-2 border-zinc-300 rounded-lg cursor-pointer hover:shadow-lg transition'
              onClick={() => navigate(`/product/${product.id}`)}
            >

              {/* Header */}
              <div className='flex justify-between items-center'>

                <button
                  className={`text-3xl cursor-pointer ${
                    wishlist.some(item => item.id === product.id)
                      ? 'text-red-600'
                      : 'text-zinc-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToWishlist(product);
                  }}
                >
                  <IoHeart />
                </button>

                <div>
                  {(product.onSale || product.newArrival) && (
                    <span
                      className={`px-3 py-1 text-white ${
                        product.onSale
                          ? 'bg-red-600'
                          : 'bg-green-600'
                      }`}
                    >
                      {product.onSale ? 'Sale' : 'New'}
                    </span>
                  )}
                </div>

              </div>

              {/* Product Image */}
              <div className='w-full h-[25vh] flex items-center justify-center'>
                <img
                  src={product.image}
                  alt={product.name}
                />
              </div>

              {/* Product Details */}
              <div className='text-center mt-3'>

                <h3 className='text-[1.4rem] font-semibold'>
                  {product.name}
                </h3>

                <div className='mt-1 mb-5'>

                  {product.onSale && product.oldPrice != null && (
                    <span className='text-zinc-600 font-semibold text-lg line-through mr-4'>
                      ${product.oldPrice.toFixed(2)}
                    </span>
                  )}

                  <span className='text-red-600 font-semibold text-lg'>
                    ${product.price.toFixed(2)}
                  </span>

                </div>

                <button
                  className='bg-linear-to-bl from-violet-300 to-fuchsia-300 text-black text-lg py-3 cursor-pointer w-full rounded-lg'
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                >
                  Add to Cart
                </button>

              </div>

            </div>

          ))
        )}

      </div>

    </section>
  );
};

export default Product;
