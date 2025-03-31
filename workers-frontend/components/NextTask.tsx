"use client";

import { BackendUrl } from "@/utils";
import axios from "axios";
import { NextRequest } from "next/server";
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
        axios.get(`${BackendUrl}/v1/worker/nextTask`,{
            headers:{
                "Authorization" : localStorage.getItem("token")
            }
        })
          .then(res =>{
            setCurrentTask(res.data)
            setLoading(false)
          })
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
                        const response = await axios.post(`${BackendUrl}/v1/worker/submission`,{
                            taskId : currentTask.id,
                            selection: option.id
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