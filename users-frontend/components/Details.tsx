"use client"

import { useState } from "react";
import { Uploads } from "./Uploads";
import axios from 'axios'
import {  useRouter } from "next/navigation";
import { BackendUrl } from "@/utils";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { connection } from "next/server";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';




export const Details =()=>{
    const [title, setTitle] = useState("");
    const [images, setImages] = useState<string []>([]);
    const [txSignature, setTxSignature] = useState("");
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const router = useRouter();

    async function onSubmit() {
        const reponse= await axios.post(`${BackendUrl}/v1/user/task`, {
            options: images.map(image =>({
                imageUrl: image
            })),
            title,
            signature: txSignature
        }, {
            headers:{
                "Authorization" : localStorage.getItem("token")                
            }
        })

        router.push(`/task/${reponse.data.id}`)
        
    }

    async function waitForConfirmation(signature: string) {
        const maxRetries = 30;
        let retry = 0;
      
        while (retry < maxRetries) {
          const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
          const confirmation = status?.value?.confirmationStatus;
      
          if (confirmation === "confirmed" || confirmation === "finalized") {
            console.log("Transaction confirmed!");
            return;
          }
      
          retry++;
          await new Promise((res) => setTimeout(res, 1000)); // Wait 1 second
        }
      
        throw new Error("Transaction confirmation timed out.");
      }
      

    async function makePayment() {
        if (!publicKey) {
            console.error("Wallet not connected");
            return;
          }

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey!,
                toPubkey: new PublicKey("FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG"),
                lamports: 100000000,
            })
        );

        console.log(transaction);
        const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight }
        } = await connection.getLatestBlockhashAndContext();

        const signature = await sendTransaction(transaction, connection, { minContextSlot });

        console.log("Transaction sent:", signature);

        await waitForConfirmation(signature);

        // await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
        setTxSignature(signature);
    }


    return(
        <div className="flex flex-col">
            <div className="text-2xl flex justify-center w-full pt-20">
                Create a New Task 
            </div>
            <label className="pl-4 text-md text-black mt-2 font-medium block">Task Name</label>
            <input
            className=" mt-1 ml-4 bg-gray-50 border border-e-gray-50 text-gray-900 text-small rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5 required "
            onChange={(e)=>{
                setTitle(e.target.value);
            }}
            type="text" placeholder="Enter Task Details"></input>
            <label className="pl-4 block mt-8 text-md font-medium text-gray-900">Add Images</label>

            {/* load and the shpwing of the data */}
            <div className="flex justify-center pt-4 max-w-screen-lg">
            {images.map(key => <Uploads image={key} onImageAdded={(imageUrl) => {
                    setImages(i => [...i, imageUrl]);
                }} />)}
            </div>

            <div className="ml-4 pt-2 flex justify-center">
                <Uploads onImageAdded={(imageUrl)=>{
                    setImages(i => [...i, imageUrl])
                }}  />
            </div>
            {/* button */}
            <div className="flex justify-center">
                <button
                className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                type="button"
                onClick={txSignature ? onSubmit : makePayment}
                >
                    {txSignature? "Submit Task" : "Pay 0.1 Sol"}
                </button>
            </div>
        </div>
    )
}