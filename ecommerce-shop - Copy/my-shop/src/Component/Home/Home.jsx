import React, { useEffect, useState } from 'react';
import Navbar from '../Navbar/Navbar';
import Banner from '../Banner/Banner';
import Product from '../Products/Product';
import Cart from '../Cart/Cart';
import Wishlist from '../../Wishlist/Wishlist';
import OrderSummary from '../OrderSummary/OrderSummary';
import OrderPlace from '../OrderPlace/OrderPlace';

const Home = () => {

  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [orderSummary, setOrderSummary] = useState(false);
  const [orderPlace, setOrderPlace] = useState(false);

  const [cart, setCart] = useState(() => {
    const storedCart = localStorage.getItem('cart');
    return storedCart ? JSON.parse(storedCart) : [];
  });

  const [wishlist, setWishlist] = useState(() => {
    const storedWishlist = localStorage.getItem('wishlist');
    return storedWishlist ? JSON.parse(storedWishlist) : [];
  });

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const totalItems = cart.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  const shippingFee = 2;
  const orderTotal = subtotal + shippingFee;

  useEffect(() => {

    const changeNavbar = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', changeNavbar);

    return () => {
      window.removeEventListener('scroll', changeNavbar);
    };

  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [cart, wishlist]);

  const handleScroll = () => {
    const section = document.getElementById('product-section');

    if (section) {
      section.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  const handlePanel = (tabName) => {
    setActivePanel(prev =>
      prev === tabName ? null : tabName
    );
  };

  const handleClose = () => {
    setActivePanel(null);
  };

  const removeItem = (product) => {
    setCart(
      cart.filter(item => item.id !== product.id)
    );
  };

  const quantityIncrement = (product) => {
    setCart(
      cart.map(item =>
        item.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1
            }
          : item
      )
    );
  };

  const quantityDecrement = (product) => {
    setCart(
      cart.map(item =>
        item.id === product.id && item.quantity > 1
          ? {
              ...item,
              quantity: item.quantity - 1
            }
          : item
      )
    );
  };

  const addToCart = (product) => {

    const alreadyAdded = cart.find(
      item => item.id === product.id
    );

    if (alreadyAdded) {
      alert('Item is already in the cart');
      return;
    }

    setCart([
      ...cart,
      {
        ...product,
        quantity: 1
      }
    ]);
  };

  const addToWishlist = (product) => {

    const isInWishlist = wishlist.some(
      item => item.id === product.id
    );

    if (isInWishlist) {

      setWishlist(
        wishlist.filter(
          item => item.id !== product.id
        )
      );

    } else {

      const addedDate =
        new Date().toLocaleString('en-GB');

      setWishlist([
        ...wishlist,
        {
          ...product,
          addedDate
        }
      ]);
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <div>

      <Navbar
        handleScroll={handleScroll}
        setSearchTerm={setSearchTerm}
        isScrolled={isScrolled}
        handlePanel={handlePanel}
        totalItems={totalItems}
        wishlist={wishlist}
      />

      <Banner />

      <Product
        searchTerm={searchTerm}
        addToCart={addToCart}
        addToWishlist={addToWishlist}
        wishlist={wishlist}
      />

      <Cart
        activePanel={activePanel}
        handleClose={handleClose}
        cart={cart}
        removeItem={removeItem}
        quantityIncrement={quantityIncrement}
        quantityDecrement={quantityDecrement}
        subtotal={subtotal}
        shippingFee={shippingFee}
        orderTotal={orderTotal}
        setOrderSummary={setOrderSummary}
      />

      <Wishlist
        activePanel={activePanel}
        handleClose={handleClose}
        wishlist={wishlist}
        addToCart={addToCart}
        clearWishlist={clearWishlist}
      />

      {orderSummary && (
        <OrderSummary
          cart={cart}
          subtotal={subtotal}
          shippingFee={shippingFee}
          orderTotal={orderTotal}
          setOrderSummary={setOrderSummary}
          setOrderPlace={setOrderPlace}
          setCart={setCart}
        />
      )}

      {orderPlace && (
        <OrderPlace
          setOrderPlace={setOrderPlace}
        />
      )}

    </div>
  );
};

export default Home;  