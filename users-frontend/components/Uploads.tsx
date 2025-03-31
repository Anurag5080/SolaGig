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
            formData.set("bucket", response.data.fields["bucket"])
            formData.set("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            formData.set("X-Amz-Credential", response.data.fields["X-Amz-Credential"]);
            formData.set("X-Amz-Date", response.data.fields["X-Amz-Date"]);
            formData.set("key", response.data.fields["key"]);
            formData.set("Policy", response.data.fields["Policy"]);
            formData.set("X-Amz-Signature", response.data.fields["X-Amz-Signature"]);
            formData.append("file", file);
            
            const s3AxiosInstance = axios.create();
            const awsresponse = await s3AxiosInstance.post(presignedUrl, formData, {
                headers: {
                    // Don't include any headers for S3 upload
                }
            });
            if (onImageAdded) {
                onImageAdded(`${CloudFront_Url}/${response.data.fields["key"]}`);
            }

        }catch(e){
            console.log(e);
        }

        setUploading(false);
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