// "use client"
// import { BackendUrl, CloudFront_Url } from "@/utils";
// import axios from "axios";
// import { useState } from "react"

// export function Uploads({onImageAdded, image} : {
//     onImageAdded?: (image : string) => void;
//     image ?: string;
// }){
//     const [uploading, setUploading] = useState(false);

//     async function onFileSelect(e: any) {
//         setUploading(true);
//         try{
//             const file = e.target.files[0];
//             const response = await axios.get(`${BackendUrl}/v1/user/presignedUrl`,{
//                 headers:{
//                     "Authorization": localStorage.getItem("token")
//                 }
//             });

//             const presignedUrl = response.data.presignedUrl;
//             const formData = new FormData();
            
//             // Add all fields from the presigned URL
//             Object.entries(response.data.fields).forEach(([key, value]) => {
//                 formData.append(key, value as string);
//             });
            
//             // Add the file last
//             formData.append('file', file);
            
//             // Make the upload request
//             const uploadResponse = await fetch(presignedUrl, {
//                 method: 'POST',
//                 body: formData
//             });

//             if (!uploadResponse.ok) {
//                 throw new Error(`Upload failed: ${uploadResponse.statusText}`);
//             }

//             // Get the key from the fields
//             const key = response.data.fields.key;
//             if (onImageAdded) {
//                 onImageAdded(`${CloudFront_Url}/${key}`);
//             }

//         }catch(e){
//             console.error("Upload error:", e);
//         }finally {
//             setUploading(false);
//         }
//     }

//     if (image) {
//         return <img className={"p-2 w-96 rounded"} src={image} />
//     }
//     return <div>
//         <div className="w-40 h-40 rounded border cursor-pointer text-2xl">
//             <div className="h-full flex justify-center relative w-full ">
//                 <div className="h-full flex justify-center ww-full pt-10 text-4xl flex-col text-black">
//                        {uploading ? <div className="text-sm">Loading...</div>
//                        :
//                        <>
//                        +
//                        <input
//                        className=" bg-red-400 w-40 h-40" type="file" style={{position: "absolute", opacity: 0, top: 0, left: 0, bottom: 0, right: 0, width: "100%", height: "100%"}} onChange={onFileSelect}
//                        ></input></>}
//                 </div>
                
//             </div>
//         </div>
//     </div>
// }





"use client"
import { BackendUrl, CloudFront_Url } from "@/utils";
import axios from "axios";
import { useState } from "react"
import { motion } from 'framer-motion';

export function Uploads({ onImageAdded, image }: {
    onImageAdded?: (image: string) => void;
    image?: string;
}) {
    const [uploading, setUploading] = useState(false);

    async function onFileSelect(e: any) {
        setUploading(true);
        try {
            const file = e.target.files[0];
            const response = await axios.get(`${BackendUrl}/v1/user/presignedUrl`, {
                headers: {
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

        } catch (e) {
            console.error("Upload error:", e);
        } finally {
            setUploading(false);
        }
    }

    if (image) {
        return <img className={"p-2 w-96 rounded"} src={image} />
    }
    // return
    // <>
    //     <div className="cursor-crosshair rounded-full border-2 text-2xl w-[50px] h-[30px] flex justify-center">

    //         <label className="text-xl text-[#B3B3B3]">Add Images</label>

    //         {uploading ? <div className="text-sm">Loading...</div>
    //             :
    //             <>
    //                 <input
    //                     className=" bg-red-400 w-40 h-40" type="file" style={{ position: "absolute", opacity: 0, top: 0, left: 0, bottom: 0, right: 0, width: "100%", height: "100%" }} onChange={onFileSelect}
    //                 ></input></>}
    //     </div>
    // </>

    return (
        <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}className="relative inline-flex items-center justify-center px-20 py-4 bg-white rounded-full hover:bg-[#19FB9B] transition-all duration-300 cursor-pointer group shadow-md hover:shadow-gray-400 font-semibold text-xl mt-7">
        <label className="text-md font-semibold text-gray-500 group-hover:text-[#0D0D0D] transition-all duration-300">
          {uploading ? "Uploading..." : "Click to add Images"}
        </label>
  
        {!uploading && (
          <input
           type="file"
           accept="image/*"
           onChange={onFileSelect}
           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        )}
        </motion.div>
    );
  
}