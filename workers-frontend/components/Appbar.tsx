"use client";
import { useState } from "react";
import { BackendUrl } from "@/utils";
import axios from "axios";

export const Appbar = () => {
    const [isConnected, setIsConnected] = useState(false);

    const connectWallet = async () => {
        try {
            const response=  await axios.post(`${BackendUrl}/v1/user/signin`,
                
            );
            localStorage.setItem("token", response.data.token);
            setIsConnected(true);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    };

    return (
        <div className="flex justify-between border pt-2 pb-2">
            <div className="flex font-bold text-2xl justify-center pl-2 pt-2">
                SolaGig
            </div> 
            <div className="flex text-2xl justify-center pr-2 pl-2">
                <button 
                    onClick={connectWallet}
                    className={`${isConnected ? 'bg-green-500' : 'bg-blue-500'} text-white px-4 py-2 rounded`}
                >
                    {isConnected ? 'Connected' : 'Connect Wallet'}
                </button>
            </div>
        </div>
    );
}