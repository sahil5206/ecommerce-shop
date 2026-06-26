import React from 'react'

import { FaTrash } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
const Cart = ({activePanel, handleClose, cart, removeItem, quantityIncrement, quantityDecrement, subtotal, orderTotal, shippingFee,setOrderSummary}) => {
  return (
    <div className= {`flex flex-col justify-between gap-5 bg-zinc-100 fixed top-0 right-0 bottom-0 left-auto z-40 w-lg border-2 border-zinc-400 py-7 tranform transition-transform duration-300
     ${activePanel === 'cart' ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* heading */}
       <div className='px-10'>
        <h3 className='text-3xl font-bold text-zinc-800 text-center'>Your cart</h3>
       </div>

       {/* cart iems */}

       <div className='flex-1 flex flex-col gap-2 overflow-y-auto scroll'>
         {
          cart.length === 0 ? 
         ( <p className='text-center'>Your Cart is Empty</p>) :
          (
            cart.map((product, index)=>{
                return(
                    <div className={`flex items-center gap-3  px-5 py-1 border-y-2 border-zinc-300 ${index % 2 === 0 ? 'bg-blue-100' : 'bg-white'}`}>

            {/* cart image */}
          <div className='w-20 h-20'>
             <img src={product.image} className='w-full h-full object-contain' />
          </div>

           {/* product detail */}
           <div className='flex-1'>
            <div className='flex justify-between'>
                <h4 className='font-semibold text-zinc-800 text-lg'>{product.name}</h4>
                <button className='w-8 h-8  bg-red-600 rounded-full text-white flex justify-center items-center mr-7 cursor-pointer active:bg-red-300'
                 onClick={()=>removeItem(product)}
                >
                   <FaTrash />
                </button>
            </div>

            <div className='flex justify-between'>
               <div>
            {
              product.onSale &&
              (
                <span className='text-zinc-600 font-semibold text-lg line-through mr-5'>${product.oldPrice.toFixed(2)}</span>
              )
            }
            <span className='text-red-600 font-semibold text-lg'>${product.price.toFixed(2)}</span>
          </div>
                <div className='flex gap-2'>
                    <button className='w-7 h-7  bg-blue-600 rounded-full text-white flex justify-center items-center text-[14px] cursor-pointer  hover:bg-sky-700 '
                    onClick={()=>quantityDecrement(product)}
                    >
                     <FaMinus />
                    </button>
                    <span>{product.quantity} </span>
                    <button  className='w-7 h-7  bg-blue-600 rounded-full text-white flex justify-center items-center text-[14px] cursor-pointer  hover:bg-sky-700 '
                    onClick={()=>quantityIncrement(product)}
                    >
                      <FaPlus />
                    </button>
                </div>
            </div>
           </div>
        </div>
                )
            }))
         }
         
       </div>

       <div className='px-10 border-y boder-zinc-800'>
        <div className='flex justify-between pt-2'>
            <span className='text-zinc-800'>SubTotal</span>
            <span className='text-zinc-800'>${subtotal.toFixed(0)}</span>

        </div>
         <div className='flex justify-between py-2'>
            <span className='text-zinc-800'>Shipping</span>
            <span className='text-zinc-800'>${(shippingFee ?? 2).toFixed(2)}</span>

        </div>
         <div className='flex justify-between py-2 border-t border-zinc-300'>
            <span className=' text-lg text-blue-500 font-bold'>OrderTotal</span>
            <span className=' text-lg text-blue-500 font-bold'>${orderTotal.toFixed(2)}</span>

        </div>
       </div>

       {/* buttons */}

       <div className='flex gap-x-2 px-10'>
        <button className='bg-sky-500 hover:bg-sky-700  text-white flex-1 h-[7vh] cursor-pointer ' onClick={handleClose}>Close</button>
        <button className={` hover:bg-sky-700  text-white flex-1 h-[7vh]  ${cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 cursor-pointer'}`}
         disabled = {cart.length === 0} onClick={()=>setOrderSummary(true)}>
          CheckOut
          </button>
       </div>
    </div>
  )
}

export default Cart
