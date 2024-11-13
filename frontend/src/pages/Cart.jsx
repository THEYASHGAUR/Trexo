import { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';

const Cart = () => {

  // Extract necessary data and functions from ShopContext
  const { products, currency, cartItems, updateQuantity, navigate } = useContext(ShopContext);

  // State to store cart data after processing cart items
  const [cartData, setCartData] = useState([]);

  // Effect hook to populate cartData based on cartItems and products
  useEffect(() => {
    // Only process if products are loaded
    if (products.length > 0) {
      const tempData = [];
      
      // Loop through each item in cartItems to build cart data structure
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          // Add item to cartData if its quantity is greater than 0
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item]
            });
          }
        }
      }
      // Set the processed data to cartData state
      setCartData(tempData);
    }
  }, [cartItems, products]); // Re-run effect if cartItems or products change

  return (
    <div className='border-t pt-14'>

      {/* Page Title */}
      <div className='text-2xl mb-3'>
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      <div>
        {/* Map over cartData to display each item in the cart */}
        {
          cartData.map((item, index) => {
            // Find product data for each cart item based on product ID
            const productData = products.find((product) => product._id === item._id);

            return (
              <div key={index} className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
                
                {/* Product Info and Image */}
                <div className='flex items-start gap-6'>
                  <img className='w-16 sm:w-20' src={productData.image[0]} alt="" />
                  <div>
                    <p className='text-xs sm:text-lg font-medium'>{productData.name}</p>
                    <div className='flex items-center gap-5 mt-2'>
                      <p>{currency}{productData.price}</p>
                      <p className='px-2 sm:px-3 sm:py-1 border bg-slate-50'>{item.size}</p>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <input 
                  onChange={(e) => e.target.value === '' || e.target.value === '0' ? null : updateQuantity(item._id, item.size, Number(e.target.value))} 
                  className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1' 
                  type="number" 
                  min={1} 
                  defaultValue={item.quantity} 
                />

                {/* Delete Icon */}
                <img 
                  onClick={() => updateQuantity(item._id, item.size, 0)} 
                  className='w-4 mr-4 sm:w-5 cursor-pointer' 
                  src={assets.bin_icon} 
                  alt="" 
                />
              </div>
            );
          })
        }
      </div>

      {/* Cart Total and Checkout Button */}
      <div className='flex justify-end my-20'>
        <div className='w-full sm:w-[450px]'>
          {/* Component to show the total price of items in cart */}
          <CartTotal />
          
          {/* Proceed to Checkout Button */}
          <div className='w-full text-end'>
            <button 
              onClick={() => navigate('/place-order')} 
              className='bg-black text-white text-sm my-8 px-8 py-3'>
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Cart;
