"use client";
import { useEffect, useState } from "react";
import { BackendUrl } from "@/utils";
import axios from "axios";

import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from "@solana/wallet-adapter-react";


export const Appbar = () => {
    const {publicKey, signMessage} = useWallet();

    
//when ever the public key changes we have to sign a msg to backend
    async function signAndSend(){
        if(!publicKey){
            return ;
        }
        const message = new TextEncoder().encode("Sign in to SolaGig");
        const signature =  await signMessage?.(message);
        const response = await axios.post(`${BackendUrl}/v1/worker/signin`, {
            signature, 
            publicKey: publicKey?.toString()
        });

        localStorage.setItem("token", response.data.token);
    }
    useEffect(()=>{

        signAndSend();
    },[publicKey]);


    return (

        <div className="flex justify-between border pt-2 pb-2">
            <div className="flex font-bold text-2xl justify-center pl-2 pt-2">
                SolaGig
            </div> 
            <div className="flex text-2xl justify-center pr-2 pl-2">
                <button onClick={ ()=>{
                    axios.post(`${BackendUrl}/v1/worker/payout`,{},{
                        headers:{
                            "Authorization": `Bearer ${localStorage.getItem("token")}`
                        }
                    })
                    .then(res =>{
                        console.log("Payout successful:",res.data)
                    })
                    .catch(e =>{
                        console.error("Payout failed:",e)
                    })
                }
                    
                }>Pay 0.1 SOl</button>
                {publicKey ? <WalletDisconnectButton/> :<WalletMultiButton/> }
            
            </div>
        </div>
    );
}