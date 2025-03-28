import { Appbar } from "@/components/Appbar";
import { Details } from "@/components/Details";
import { Hero } from "@/components/Hero";
import {  Uploads } from "@/components/Uploads";


export default function Home() {
  return (
    <div>
      <Appbar />
      <Hero />
      <Details />
      <Uploads />
    </div>
    
    
    
  );
}
