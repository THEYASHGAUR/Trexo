import { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'; 
import axios from 'axios'; 
import { toast } from 'react-toastify'; 
import LoadingPage from '../components/Loading'; 

const Login = () => {

  
  const [loading , setLoading] = useState(false);

  // State to toggle between 'Login' and 'Sign Up' modes
  const [currentState, setCurrentState] = useState('Login');
  
  // Destructure necessary values from ShopContext
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)

  // State to hold form input values
  const [name,setName] = useState('') 
  const [password,setPassword] = useState('') 
  const [email,setEmail] = useState('') 

  // Function to handle form submission
  const onSubmitHandler = async (event) => {
      event.preventDefault(); 
      setLoading(true); 

      try {
        // Check if the current form mode is 'Sign Up'
        if (currentState === 'Sign Up') {
          
          
          const response = await axios.post(backendUrl + '/api/user/register', {name, email, password})

          // If registration is successful, set the token and store it in local storage
          if (response.data.success) {
            setToken(response.data.token)
            localStorage.setItem('token', response.data.token)
          } else {
            toast.error(response.data.message) 
          }

        } else {
          // API call to log in the user
          const response = await axios.post(backendUrl + '/api/user/login', {email, password})

          // If login is successful, set the token and store it in local storage
          if (response.data.success) {
            setToken(response.data.token)
            localStorage.setItem('token', response.data.token)
          } else {
            toast.error(response.data.message) // Show error notification if login fails
          }
        }
        setLoading(false) // Set loading to false after API call completes

      } catch (error) {
        console.log(error) // Log the error for debugging
        toast.error(error.message) // Show error notification on request failure
        setLoading(false) // Stop loading in case of an error
      }
  }

  // Effect to navigate the user to home if they are already logged in (token exists)
  useEffect(() => {
    if (token) {
      navigate('/') 
    }
  }, [token])

  
  if(loading){
    return <LoadingPage />
  }

  return (
    // Form for login or sign-up
    <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
        
        {/* Form heading with dynamic state (Login or Sign Up) */}
        <div className='inline-flex items-center gap-2 mb-2 mt-10'>
            <p className='prata-regular text-3xl'>{currentState}</p>
            <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
        </div>
        
        {/* Only show the name input if the state is 'Sign Up' */}
        {currentState === 'Login' ? '' : (
          <input 
            onChange={(e)=>setName(e.target.value)} 
            value={name} 
            type="text" 
            className='w-full px-3 py-2 border border-gray-800' 
            placeholder='Name' 
            required
          />
        )}

        
        <input 
          onChange={(e)=>setEmail(e.target.value)} 
          value={email} 
          type="email" 
          className='w-full px-3 py-2 border border-gray-800' 
          placeholder='Email' 
          required
        />
        
        
        <input 
          onChange={(e)=>setPassword(e.target.value)} 
          value={password} 
          type="password" 
          className='w-full px-3 py-2 border border-gray-800' 
          placeholder='Password' 
          required
        />

        {/* Link to switch between Login and Sign Up */}
        <div className='w-full flex justify-between text-sm mt-[-8px]'>
            <p className=' cursor-pointer'>Forgot your password?</p>
            {
              currentState === 'Login' 
              ? <p onClick={()=>setCurrentState('Sign Up')} className=' cursor-pointer'>Create account</p> 
              : <p onClick={()=>setCurrentState('Login')} className=' cursor-pointer'>Login Here</p>
            }
        </div>

        
        <button className='bg-black text-white font-light px-8 py-2 mt-4'>
          {currentState === 'Login' ? 'Sign In' : 'Sign Up'}
        </button>
    </form>
  )
}

export default Login;
