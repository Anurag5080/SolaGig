"use client"
import { BackendUrl, CloudFront_Url } from "@/utils";
import axios from "axios";
import { useState } from "react"

export function Uploads({onImageAdded, image} : {
    onImageAdded?: (image : string) => void;
    image ?: string;
}){
    const [uploading, setUploading] = useState(false);

    async function onFileSelect(e: any) {
        setUploading(true);
        try{
            const file = e.target.files[0];
            const response = await axios.get(`${BackendUrl}/v1/user/presignedUrl`,{
                headers:{
                    "Authorization": localStorage.getItem("token")
                }
            });

            const presignedUrl = response.data.presignedUrl;
            const formData = new FormData();
            
            // Add all fields from the presigned URL
            Object.entries(response.data.fields).forEach(([key, value]) => {
                formData.append(key, value as string);
            });
            
            // Add the file last
            formData.append('file', file);
            
            // Make the upload request
            const uploadResponse = await fetch(presignedUrl, {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            // Get the key from the fields
            const key = response.data.fields.key;
            if (onImageAdded) {
                onImageAdded(`${CloudFront_Url}/${key}`);
            }

        }catch(e){
            console.error("Upload error:", e);
        }finally {
            setUploading(false);
        }
    }

    if (image) {
        return <img className={"p-2 w-96 rounded"} src={image} />
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