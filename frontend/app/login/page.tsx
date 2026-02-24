'use client'

import { useState } from "react";
import {motion} from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {Eye,EyeOff,Mail, Phone, PhoneCallIcon,} from "lucide-react"
import {useRouter} from "next/navigation"


export default function Home(){
    const [username,setUsername]=useState('')
    const [password,setPassword]=useState('')
    const [showPassword,setShowPassword]=useState(false)
    const router = useRouter();

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const users = JSON.parse(localStorage.getItem("users") || "[]");

  const validUser = users.find(
    (user: any) =>
      user.username === username &&
      user.password === password
  );

  if (validUser) {
    console.log("Login successful");
     router.push("http://localhost:3000/");
  } else {
    console.log("Invalid credentials");
  }
};
    return (
       <motion.div
  initial={{ opacity: 0, scale: 1.1 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 1 }}
  className="relative min-h-screen flex items-center justify-center p-4 bg-no-repeat bg-left bg-contain"
  style={{ backgroundImage: "url('/human.png')" }}
>


            
            <motion.div
               initial={{opacity:0,y:-20}} 
               animate={{opacity:1,y:0}}
               transition={{duration:0.5}}
               className="w-full max-w-md"
            
            >
                

                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 ">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tighter">Welcome Back</h1>
                        <p className="text-muted-foreground">Securely log in to your account </p>

                       

                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                            id="username"
                            type="username"
                            placeholder="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            />

                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input 
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="password"
                                    value={password}
                                    onChange={(e)=> setPassword(e.target.value)}
                                    required
                                />
                                <button 
                                type="button"
                                onClick={()=> setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    
                                </button>


                            </div>


                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                    <Checkbox id="remember"/>
                                    <Label htmlFor="remember">Remember me</Label>
                            </div>
                                <a href="#" className="text-sm text-primary-500 hover:text-primary-600">
                                    Forgot Password?

                                </a>

                        </div>
                            <Button type="submit" className="w-full">
                            Log In
                            </Button>

                    </form>
                        <div className="relative">
                            <div className="absolute inset=0 flex items-center">
                                <span className="w=full border-t"/>

                            </div>
                             

                        </div>
                        
                        <div className="text-center text sm">
                            Don't have an account?{" "}
                            <a href="/signup_page" className="text-primary-500 hover:text-primary-600 font-medium">
                                Sign Up
                            </a>

                        </div>
                </div>


            </motion.div>
            
            
       </motion.div>
    );

}