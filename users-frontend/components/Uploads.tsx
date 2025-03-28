"use client"
import { useState } from "react"

export function Uploads({onImageAdded, image} : {
    onImageAdded?: (image : string) => void;
    image ?: string;
}){
    const [uploading, setUploading] = useState(false);
    async function onFileSelect() {
        
    }
    return <div>
        <div className="w-40 h-40 rounded border cursor-pointer text-2xl">
            <div className="h-full flex justify-center relative w-full ">
                <div className="h-full flex justify-center ww-full pt-10 text-4xl flex-col text-black">
                       {uploading ? <div className="text-sm">Loading...</div>
                       :
                       <>
                       +
                       <input
                       className=" bg-red-400 w-40 h-40" type="file" style={{position: "absolute", opacity: 0, top: 0, left: 0, bottom: 0, right: 0, width: "100%", height: "100%"}} onChange={onFileSelect}
                       ></input></>}
                </div>
                
            </div>
        </div>
    </div>
}