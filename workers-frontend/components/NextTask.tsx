"use client";

import { BackendUrl } from "@/utils";
import axios from "axios";
import { useEffect, useState } from "react"

interface Task {
    id: number,
    title: string,
    options: Array<{
        id: number,
        image_url: string,
        taskId: number
    }>,
    amount: number
}

export const NextTask =  ()=>{
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [loading , setLoading] = useState(false);

    
    useEffect(()=>{
        setLoading(true)
        const token = localStorage.getItem("token");
        
        if (!token) {
            console.error("No token found");
            setLoading(false);
            return;
        }
// Add this before the axios request to debug
        console.log("Token:", localStorage.getItem("token"));
        const response = axios.get(`${BackendUrl}/v1/worker/nextTask`,{
            headers:{
                "Authorization" : token
            }
        })                                                                                                          
          .then(res =>{
            console.log(res.data)
            setCurrentTask(res.data.task)
            
          })
          .catch(error => {
            console.error("Error fetching task:", error);
        })
        
        .finally(() => setLoading(false));
        console.log(response);

    },[])
    



    if(loading){
        return (
            <div>
                Loading...
            </div>
        )
    }

    if(!currentTask){
        return (
            <div>
                Please return to after sometimes, their is no pending task at that moment
            </div>
        )
    }
    return (
        <div>
            <div  className="text-2xl p-20 flex justify-center">
                {currentTask.title}
            </div>
            <div className='flex justify-center pt-8'>
                {currentTask?.options?.map((option) => (
                    <Option
                    key={option.id}
                    imageUrl={option.image_url}
                    onSelect={async ()=>{
                        console.log("Working fine");
                        const response = await axios.post(`${BackendUrl}/v1/worker/submission`,{
                            taskId : currentTask.id.toString(),
                            selection: option.id.toString()
                        }, {
                            headers:{
                                "Authorization" : localStorage.getItem("token")
                            }
                        });

                        const nextTask =  response.data.nextTask;
                        if(nextTask){
                            setCurrentTask(nextTask);
                        }else{
                            setCurrentTask(null);
                        }
                    }}
                    />
                ))}
            </div>
        </div>
    )


}

function Option({imageUrl,onSelect} : {
    imageUrl : string;
    
    onSelect : ()=> void

}){
    return <div>
            <img onClick={onSelect} className={"p-2 w-96 rounded-md"} src={imageUrl} alt="Task option" />
            
        </div>
}