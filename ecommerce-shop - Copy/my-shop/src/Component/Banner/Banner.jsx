import React, { useEffect, useState } from 'react'
import BannerImage from '../../assets/banner.jpg'

const Banner = () => {

    const initialTime = 10 * 60 * 60;
    const [timeLeft, setTimeLeft] = useState(() => {
        const storedTime = localStorage.getItem('remainingTime');
        return storedTime && parseInt(storedTime, 10) > 0 ?
            parseInt(storedTime, 10) : initialTime
    });

    const formatTime = (time) => {

        useEffect(() => {

            if (timeLeft <= 0) return
            const timer = setInterval(() => {


                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        return 0;
                    }

                    const remainingTime = prev - 1
                    localStorage.setItem('remainingTime', 0);

                    return remainingTime;
                })
            }, 1000)

            return () => clearInterval(timer);

        }, [timeLeft])

        const hours = Math.floor(time / 3600);
        const mintues = Math.floor((time % 3600) / 60);
        const seconds = time % 60;

        return {
            hours: String(hours).padStart(2, '0'),
            mintues: String(mintues).padStart(2, '0'),
            seconds: String(seconds).padStart(2, '0')
        }
    }

    const { hours, mintues, seconds } = formatTime(timeLeft);

    return (
        <section className=' h-[60vh] mt-[14vh] bg-cover bg-top' style={{ backgroundImage: `url(${BannerImage})` }}>
            <div className='max-w-6xl  px-12 h-100 mx-auto flex flex-col justify-center gap-3'>
                <h1 className='text-red-600 text-9xl uppercase font-bold tracking-tight'>Big Sale!</h1>
                <h2 className='text-zinc-600 text-3xl'>up to 50% OFF - Limited Time Only</h2>
                <div className='text-6xl font-bold text-zinc-800 flex gap-x-3 mt-5'>
                    <span className='text-white bg-zinc-800 p-1'>{hours}</span>:
                    <span className='text-white bg-zinc-800 p-1'>{mintues}</span>:
                    <span className='text-white bg-zinc-800 p-1'>{seconds}</span>
                </div>
            </div>

        </section>
    )
}

export default Banner
