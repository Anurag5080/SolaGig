import { Appbar } from "@/components/Appbar";
import { Details } from "@/components/Details";
import { Hero } from "@/components/Hero";
import { Task } from "@/components/Task";
import {  Uploads } from "@/components/Uploads";


export default function Home() {
  return (
    <div>
      <Appbar />
      <Hero />
      <Details />
      {/* <Task params={taskId }/> */}
      </div>
    
    
    
  );
}
