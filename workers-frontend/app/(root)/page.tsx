

import { Appbar } from "@/components/Appbar";
import { NextTask } from "@/components/NextTask";


export default function Home() {
  return (
   <div className="overflow-x-hidden p-5 pb-50 bg-[#0D0D0D]">
   <Appbar />
   <NextTask />
   </div>
  );
}
