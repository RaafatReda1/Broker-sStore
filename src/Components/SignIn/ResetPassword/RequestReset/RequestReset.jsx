import React, { useState } from 'react'
import supabase from '../../../../SupabaseClient';
import { toast } from 'react-toastify';

const RequestReset = () => {
  const [email, setEmail] = useState("");
  const sendResetRequest = async (e) => {
    const redirectUrl = window.location.origin + "/doreset";
    e.preventDefault();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) {
      console.log(error);
    }else if(data){
      console.log(data);
      toast.success("Check your email for password reset instructions.");
    }
  }
  

  return (
    <div className='request-reset-container'>
      <form>
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={sendResetRequest}>Send Reset Link</button>
      </form>
    </div>
  )
}

export default RequestReset