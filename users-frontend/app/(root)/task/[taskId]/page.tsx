"use client"
import { Appbar } from "@/components/Appbar"
import { BackendUrl } from "@/utils"
import axios from "axios"
import { useEffect, useState } from "react"
import {use} from "react";


async function getTaskDetails(taskId: string){
    const response = await axios.get(`${BackendUrl}/v1/user/task?taskId=${taskId}`,{
        headers:{
            "Authorization" : localStorage.getItem("token")
        }
    }
    )

    return response.data;
}

export default  function Task ({
    params
}: {
    params :{taskId : string}
}){

    const taskId = params.taskId;
    const [result, setResult] = useState<Record<string,{
        count: number,
        options:{
            imageUrl: string
        }
    }>>({});

    const [taskDetails, setTaskDetails] = useState<
    {
        title?: string
    }>({});

    useEffect(()=>{
        getTaskDetails(taskId as unknown as string)
          .then((data) =>{
            setResult(data.result)
            setTaskDetails(data.taskDetails)
          })
          .catch((error =>{
            console.error("Error Fetching task details", error)
          }))
    }, [taskId])


    return (
        <div className=' overflow-x-hidden p-2 pb-35 overflow-y-hidden  bg-[#0D0D0D] text-2xl flex flex-col'>
            <Appbar />
            <div className="text-2xl text-white font-bold pt-25 flex justify-center">
                {taskDetails.title}
            </div>
            <div className='flex justify-center pt-8'>
                {Object.keys(result || {})
                .map(taskId => (
                    <TaskDetails
                    key={taskId}
                    imageUrl={result[taskId].options.imageUrl}
                    votes={result[taskId].count}
                    />
                ))}
            </div>
        </div>
    )


    function TaskDetails ({imageUrl, votes}:{
        imageUrl : string,
        votes: number
    }){
        return <div>
            <img className={"p-2 w-96 rounded-md"} src={imageUrl} alt="Task option" />
            <div className='flex text-white justify-center item-center font-semibold'>
                {votes}
            </div>
        </div>
    }
}