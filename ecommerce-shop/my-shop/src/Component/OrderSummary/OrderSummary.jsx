import React, { useState } from 'react'
import { createOrder } from '../../services/api';

const OrderSummary = ({cart, subtotal, shippingFee, orderTotal, setOrderPlace, setOrderSummary, setCart}) => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handlePlaceOrder = async () => {
      setSubmitting(true);
      setError(null);

      try {
        const items = cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        }));

        await createOrder({
          items,
          subtotal,
          shippingFee,
          orderTotal,
        });

        setOrderSummary(false);
        setOrderPlace(true);
        setCart([]);
      } catch (err) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
    }

  return (
    <section className='flex justify-center items-center bg-black/95 fixed inset-0 z-40'>
     <div className='bg-zinc-100 p-8 w-xl rounded-lg border-2'>
        <h2 className='text-3xl text-zinc-800 font-bold mb-5 text-center'>Order Summary</h2>

           <div>
            <div>
               {
                cart.map(item=>(
                    <div key={item.id} className='flex justify-between items-center'>
                     <span className='text-zinc-800 py-2'>{item.name}(x{item.quantity})</span>
                     <span className='text-zinc-800 py-2'>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    
                ))
               }
            </div>

            <div className='flex justify-between pt-3'>
                <span className='text-zinc-800'>SubTotal</span>
                <span className='text-zinc-800'>${subtotal.toFixed(2)}</span>
            </div>
             <div className='flex justify-between py-3'>
                <span className='text-zinc-800'>Shipping</span>
                <span className='text-zinc-800'>${(shippingFee ?? 2).toFixed(2)}</span>
            </div>
             <div className='flex justify-between pt-3 border-t-2 border-zinc-400 mb-5'>
                <span className='text-blue-600 font-bold text-xl'>Order Total</span>
                <span className='text-blue-600  font-bold text-xl'>${orderTotal.toFixed(2)}</span>
            </div>
           </div>

           {error && (
             <p className="text-red-600 text-center mb-4">{error}</p>
           )}

           <div className='flex mt-10 gap-x-6'>
            <button className='bg-zinc-800 flex-1 py-3 hover:bg-zinc-500 text-white rounded-lg cursor-pointer' onClick={()=>setOrderSummary(false)} disabled={submitting}>Cancel</button>
            <button className='bg-blue-500 flex-1 py-3 hover:bg-blue-300 text-white rounded-lg cursor-pointer disabled:opacity-60' onClick={handlePlaceOrder} disabled={submitting}>
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
           </div>
     </div>
    </section>
  )
}

export default OrderSummary
