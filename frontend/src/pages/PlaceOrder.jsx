import { useContext, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
// import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import LoadingPage from '../components/Loading'

const PlaceOrder = () => {

    // State management
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState('cod');
    const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', street: '', city: '', state: '', zipcode: '', country: '', phone: ''
    })

    // Updates form data
    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setFormData(data => ({ ...data, [name]: value }));
    }

    // Initiates Razorpay payment
    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Order Payment',
            description: 'Order Payment',
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                try {
                    const { data } = await axios.post(`${backendUrl}/api/order/verifyRazorpay`, response, { headers: { token } });
                    if (data.success) {
                        navigate('/orders');
                        setCartItems({});
                    }
                } catch (error) {
                    toast.error(error.message);
                }
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    }

    // Handles order placement
    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            // Prepares order items
            const orderItems = [];
            for (const items in cartItems) {
                for (const item in cartItems[items]) {
                    if (cartItems[items][item] > 0) {
                        const itemInfo = structuredClone(products.find(product => product._id === items));
                        if (itemInfo) {
                            itemInfo.size = item;
                            itemInfo.quantity = cartItems[items][item];
                            orderItems.push(itemInfo);
                        }
                    }
                }
            }

            // Creates order data
            const orderData = {
                address: formData,
                items: orderItems,
                amount: getCartAmount() + delivery_fee
            };

            // Processes order based on payment method
            switch (method) {
                case 'cod': {
                    const response = await axios.post(`${backendUrl}/api/order/place`, orderData, { headers: { token } });
                    if (response.data.success) {
                        setCartItems({});
                        navigate('/orders');
                    } else {
                        toast.error(response.data.message);
                    }
                    break;
                }
                case 'stripe': {
                    const responseStripe = await axios.post(`${backendUrl}/api/order/stripe`, orderData, { headers: { token } });
                    if (responseStripe.data.success) {
                        window.location.replace(responseStripe.data.session_url);
                    } else {
                        toast.error(responseStripe.data.message);
                    }
                    break;
                }
                case 'razorpay': {
                    const responseRazorpay = await axios.post(`${backendUrl}/api/order/razorpay`, orderData, { headers: { token } });
                    if (responseRazorpay.data.success) {
                        initPay(responseRazorpay.data.order);
                    }
                    break;
                }
                default:
                    break;
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <LoadingPage />;

    return (
        <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
            {/* Delivery Information Form */}
            <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
                <Title text1={'DELIVERY'} text2={'INFORMATION'} />
                <input onChange={onChangeHandler} name='firstName' value={formData.firstName} required placeholder='First name' />
                {/* Additional input fields for address and contact */}
            </div>

            {/* Payment Section */}
            <div className='mt-8'>
                <CartTotal />
                <Title text1={'PAYMENT'} text2={'METHOD'} />
                <div onClick={() => setMethod('razorpay')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                    {/* Razorpay payment method selection */}
                </div>
                <button type='submit' className='bg-black text-white px-16 py-3'>PLACE ORDER</button>
            </div>
        </form>
    )
}

export default PlaceOrder
