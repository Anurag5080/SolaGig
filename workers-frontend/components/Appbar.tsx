// "use client";
// import { useEffect, useState } from "react";
// import { BackendUrl } from "@/utils";
// import axios from "axios";

// import {
//     WalletDisconnectButton,
//     WalletMultiButton
// } from '@solana/wallet-adapter-react-ui';
// import { useWallet } from "@solana/wallet-adapter-react";


// export const Appbar = () => {
//     const {publicKey, signMessage} = useWallet();

    
// //when ever the public key changes we have to sign a msg to backend
//     async function signAndSend(){
//         if(!publicKey){
//             return ;
//         }
//         const message = new TextEncoder().encode("Sign in to SolaGig");
//         const signature =  await signMessage?.(message);
//         const response = await axios.post(`${BackendUrl}/v1/worker/signin`, {
//             signature, 
//             publicKey: publicKey?.toString()
//         });

//         localStorage.setItem("token", response.data.token);
//     }
//     useEffect(()=>{

//         signAndSend();
//     },[publicKey]);


//     return (

//         <div className="flex justify-between border pt-2 pb-2">
//             <div className="flex font-bold text-2xl justify-center pl-2 pt-2">
//                 SolaGig
//             </div> 
//             <div className="flex text-2xl justify-center pr-2 pl-2">
//                 <button onClick={ ()=>{
//                     axios.post(`${BackendUrl}/v1/worker/payout`,{},{
//                         headers:{
//                             "Authorization": `Bearer ${localStorage.getItem("token")}`
//                         }
//                     })
//                     .then(res =>{
//                         console.log("Payout successful:",res.data);
//                         alert("Payout successful");
//                     })
//                     .catch(e =>{
//                         console.error("Payout failed:",e)
//                     })
//                 }
                    
//                 }>Pay 0.1 SOl</button>
                
//                 {publicKey ? <WalletDisconnectButton/> :<WalletMultiButton/> }
            
//             </div>
//         </div>
//     );
// }

// "use client";
// import { useEffect, useState } from "react";
// import { BackendUrl } from "@/utils";
// import axios from "axios";

// import {
//     WalletDisconnectButton,
//     WalletMultiButton
// } from '@solana/wallet-adapter-react-ui';
// import { useWallet } from "@solana/wallet-adapter-react";


// export const Appbar = () => {
//     const {publicKey, signMessage} = useWallet();

    
// //when ever the public key changes we have to sign a msg to backend
//     async function signAndSend(){
//         if(!publicKey){
//             return ;
//         }
//         const message = new TextEncoder().encode("Sign in to SolaGig");
//         const signature =  await signMessage?.(message);
//         const response = await axios.post(`${BackendUrl}/v1/user/signin`, {
//             signature, 
//             publicKey: publicKey?.toString()
//         });

//         localStorage.setItem("token", response.data.token);
//     }
//     useEffect(()=>{

//         signAndSend();
//     },[publicKey]);


//     return (

//         <div className="flex justify-between border pt-2 pb-2">
//             <div className="flex font-bold text-2xl justify-center pl-2 pt-2">
//                 SolaGig
//             </div> 
//             <div className="flex text-2xl justify-center pr-2 pl-2">
//                 {publicKey ? <WalletDisconnectButton/> :<WalletMultiButton/> }
            
//             </div>
//         </div>
//     );
// }

"use client";
import { useEffect, useState } from "react";
import { BackendUrl } from "@/utils";
import axios from "axios";
import Image from 'next/image';
import { motion } from 'framer-motion';


import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from "@solana/wallet-adapter-react";


export const Appbar = () => {
    const { publicKey, signMessage } = useWallet();


    //when ever the public key changes we have to sign a msg to backend
    async function signAndSend() {
        if (!publicKey) {
            return;
        }
        const message = new TextEncoder().encode("Sign in to SolaGig");
        const signature = await signMessage?.(message);
        const response = await axios.post(`${BackendUrl}/v1/worker/signin`, {
            signature,
            publicKey: publicKey?.toString()
        });

        localStorage.setItem("token", response.data.token);
    }
    useEffect(() => {

        signAndSend();
    }, [publicKey]);


    return (

        <div
        className="bg-[#0D0D0D] flex items-center justify-between border m-6">
            
            <motion.div
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-[#FFFFFF] font-bold text-2xl flex flex-col cursor-pointer">
            <Image src="/camera (1).png" alt="Description" width={50} height={10}/>
                SolaGig
            </motion.div>
            <motion.div
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.6 }}
            className="text-xl gap-3 flex flex-row justify-center items-center">
                <button onClick={ ()=>{
                    axios.post(`${BackendUrl}/v1/worker/payout`,{},{
                        headers:{
                            "Authorization": `Bearer ${localStorage.getItem("token")}`
                        }
                    })
                    .then(res =>{
                        console.log("Payout successful:",res.data);
                        alert("Payout successful");
                    })
                    .catch(e =>{
                        console.error("Payout failed:",e)
                    })
                }
                    
                }
                className="shadow-md hover:shadow-gray-400 font-semibold text-xl px-15 py-4 mt-6 text-white transition-all duration-300 cursor-pointer bg-gray-800 hover:bg-[#9945FF] focus:outline-none focus:ring-4 focus:ring-[#9945FF] rounded-full dark:bg-gray-800 dark:hover:bg-[#9945FF] dark:focus:ring-[#9945FF] dark:border-gray-700"
                >Pay 0.1 SOl</button>
                {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}

            </motion.div>
        </div>
    );
}