import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';
import {axiosInstance} from '../../lib/axios';

const SignUpForm = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const queryClient = useQueryClient();

    const {mutate: signUpMutation, isLoading} =useMutation({
        mutationFn: async(data) => {
            const res = await axiosInstance.post('/auth/signup', data)
            return res.data
        },
        onSuccess:()=>{toast.success("Account created successfully")
        queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError:(error)=>{
            console.log("An error occured", error);
            toast.error( error.response.data.message || "Something went wrong");
        }
    });

    const handleSignUp = (e) => {
        e.preventDefault();
        signUpMutation({name, email, username, password});
        // console.log(name, email, username, password);
    }
    return <form onSubmit={handleSignUp} className='flex flex-col gap-4'>
            <input type="text" placeholder='Full name' value={name} onChange={(e) => setName(e.target.value)}
            className='input input-bordered w-full'
            required
             />

            <input type="text" placeholder='Username' value={username} onChange={(e) => setUsername(e.target.value)}
            className='input input-bordered w-full'
            required
             />
             
            <input type="email" placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)}
            className='input input-bordered w-full'
            required
             />
           
            <input type="password" placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)}
            className='input input-bordered w-full'
            required
             />

             <button type="submit" disabled={isLoading} className='btn btn-primary w-full text-white'>
                {isLoading ? <Loader className='animate-spin'/> : "Agree and Join"}
            </button>
    </form>
};
export default SignUpForm;
