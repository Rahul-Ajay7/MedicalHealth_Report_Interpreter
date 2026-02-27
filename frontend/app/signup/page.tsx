'use client'

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface User {
  username: string;
  password: string;
}

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newUser: User = { username, password };

    const users = JSON.parse(localStorage.getItem("users") || "[]");

    users.push(newUser);

    localStorage.setItem("users", JSON.stringify(users));

    alert("Signup successful!");

    router.push("/login");
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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">

          <div className="text-center">
            <h1 className="text-3xl font-bold">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Sign Up
            </Button>

          </form>

          <div className="text-center">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 font-medium">
              Log In
            </a>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}