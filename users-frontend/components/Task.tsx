"use client"
import { Appbar } from "@/components/Appbar"
import { BackendUrl } from "@/utils"
import axios from "axios"
import { useEffect, useState } from "react"
import { use } from "react"

async function getTaskDetails(taskId: string){
    const response = await axios.get(`${BackendUrl}/v1/user/task?taskId=${taskId}`,{
        headers:{
            "Authorization" : localStorage.getItem("token")
        }
    }
    )

    return response.data;
}

export const Task = ({
    params
}: {
    params: Promise<{taskId: string}>
})=>{
    const { taskId } = use(params);

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
        getTaskDetails(taskId)
          .then((data) =>{
            setResult(data.result)
            setTaskDetails(data.taskDetails)
          })
    }, [taskId])


    return (
        <div className='text-2xl pt-20 flex justify-center'>
            <Appbar />
            <div>
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
            <div className='flex justify-center'>
                {votes}
            </div>
        </div>
    }
}

