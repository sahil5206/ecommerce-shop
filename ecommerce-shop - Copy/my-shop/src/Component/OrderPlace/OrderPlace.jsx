import React from 'react'

const OrderPlace = ({setOrderPlace}) => {
  return (
    <section className='flex justify-center items-center bg-black/95  fixed inset-0 z-40'>
        <div className='bg-zinc-100 p-8 text-center w-xl rounded-lg border-2 border-zinc-300'>
          <h2 className='text-3xl text-green-600 font-bold'>Order Placed!</h2>
          <p className='text-zinc-600 my-4'>Thanks for your Purchase</p>
          <button className='px-6 py-3 text-white bg-blue-600 hover:bg-blue-400 rounded-lg' onClick={()=>setOrderPlace(false)}>Close</button>
        </div>
    </section>
  )
}

export default OrderPlace
