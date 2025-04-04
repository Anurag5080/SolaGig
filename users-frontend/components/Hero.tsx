// export const Hero = ()=>{
//     return (
//         <div className="text-black pt-10">
//             <div className="text-2xl flex justify-center">
//                 Welcome to SolaGig
//             </div>
//             <div className="text-lg flex justify-center pt-6">
//             Your one stop destination to getting your pay for the review
//             </div>
//         </div>
//     )
// }

"use client"
import Image from 'next/image';
import { motion } from 'framer-motion';

export const Hero = () => {
    return (
        <div
        className="flex mt-10 mb-20">
            <motion.div
            initial={{ y: -30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-[#0D0D0D] flex flex-col justify-center mt-10 w-[50%]">
                <div className="text-[#FFFFFF] font-bold text-8xl mt-10 ml-10 leading-26">
                    <span className='hover:text-[#19FB9B] transition-all duration-300 cursor-pointer'>Welcome to</span> <span className="text-[#9945FF] hover:text-[#19FB9B]">SolaGig</span></div>
                <div className="text-[#B3B3B3] font-semibold text-2xl mt-15 ml-10 w-[70%]">Your one stop destination to getting your pay for the review. Join the community of creators and buisnesses on <span className='text-[#9945FF]'>Sola</span><span className='text-[#19FB9B]'>Gig</span> today.</div>
            </motion.div>
            <motion.div
            initial={{ y: -30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }} 
            className="bg-[#0D0D0D] flex flex-col justify-center mt-10 w-[50%]">
                <Image className='rounded-full shadow-[0_0_60px_#9945FF]' src="/depositphotos_574520114-stock-illustration-solana-sol-coins-falling-sky.jpg" alt="Description" width={500} height={100} />
            </motion.div>
        </div>
    )
};