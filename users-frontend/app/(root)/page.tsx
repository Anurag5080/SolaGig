// import { Appbar } from "@/components/Appbar";
// import { Details } from "@/components/Details";
// import { Hero } from "@/components/Hero";
// import { Task } from "@/components/Task";
// import {  Uploads } from "@/components/Uploads";


// export default function Home() {
//   return (
//     <div>
//       <Appbar />
//       <Hero />
//       <Details />
//       {/* <Task params={taskId }/> */}
//       </div>
    
    
    
//   );
// }

import { Appbar } from "@/components/Appbar";
import { Details } from "@/components/Details";
import { Hero } from "@/components/Hero";
import { Task } from "@/components/Task";
import {  Uploads } from "@/components/Uploads";


export default function Home() {
  return (
    <div className="overflow-x-hidden p-5 pb-50 bg-[#0D0D0D]">
      <Appbar />
      <Hero />
      <Details />
      {/* <Task params={taskId }/> */}
      </div>
    
    
    
  );
}