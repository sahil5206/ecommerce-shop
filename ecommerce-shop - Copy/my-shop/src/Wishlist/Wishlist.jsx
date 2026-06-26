 import React from 'react'
 
 const Wishlist = ({activePanel, handleClose, wishlist, addToCart, clearWishlist}) => {
   return (
     <div className={`flex flex-col justify-between gap-5 bg-zinc-100 fixed top-0 right-0 bottom-0 left-auto z-40 w-lg border-2 border-zinc-400 py-7 tranform duration-300 ${activePanel === 'wishlist' ?  'translate-x-0' : 'translate-x-full'}`}>
        {/* heading */}
       <div className='px-10'>
        <h3 className='text-3xl font-bold text-zinc-800 text-center'>Your Wishlist</h3>
       </div>

       {/* cart iems */}

       <div className='flex-1 flex flex-col gap-2'>
       {
        wishlist.length === 0 ?
        (<p className='text-center text-zinc-700'>your wishlist is empty</p>) :
        (
           
        wishlist.map((product,index)=>{
          return(
            
             <div className= {`flex items-center gap-3 bg-white px-5 py-1 border-y-2 border-zinc-300`}>

            {/* cart image */}
          <div className='w-20 h-20'>
             <img src={product.image} className='w-full h-full object-contain' />
          </div>

           {/* product detail */}
           <div className='flex-1'>
            <div className='flex justify-between'>
                <h4 className='font-semibold text-zinc-800 text-lg'>{product.name}</h4>
                <p className='text-sm text-zinc-500'>added:{product.addedDate}</p>
            </div>

            <div className='flex justify-between'>
               
           <div className='mt-1 mb-5'>
            {
              product.onSale &&
              (
                <span className='text-zinc-600 font-semibold text-lg line-through mr-4'>${product.oldPrice.toFixed(2)}</span>
              )
            }
            <span className='text-red-600 font-semibold text-lg'>${product.price.toFixed(2)}</span>
          </div>
                <button className='bg-blue-600  text-white text-sm px-5 py-2 rounded-full active:bg-blue-700 cursor-pointer' onClick={()=>addToCart(product)}>Add to Cart</button>
            </div>
           </div>
        </div>
          )
        })
       
        )
       }
       </div>

       {/* buttons */}

       <div className='flex gap-x-2 px-10'>
        <button className='bg-sky-500 hover:bg-sky-700  text-white flex-1 h-[7vh] cursor-pointer' onClick={handleClose}>Close</button>
        <button className='bg-sky-500 hover:bg-sky-700  text-white flex-1 h-[7vh] cursor-pointer' onClick={clearWishlist}>Clear All</button>
       </div>
    </div>
   )
 }
 
 export default Wishlist
 