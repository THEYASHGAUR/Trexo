import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'

// Create the context to share shopping data and functions across components
export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    // Define global constants and state variables
    const currency = '$';               // Currency symbol
    const delivery_fee = 10;            // Delivery fee amount
    const backendUrl = import.meta.env.VITE_BACKEND_URL;  // Backend URL from environment variables
    const [search, setSearch] = useState('');             // Search query state
    const [showSearch, setShowSearch] = useState(false);  // Search visibility toggle
    const [cartItems, setCartItems] = useState({});       // Cart items state
    const [products, setProducts] = useState([]);         // Products list state
    const [token, setToken] = useState('');               // User authentication token
    const navigate = useNavigate();                       // Navigation function

    // Function to add an item to the cart
    const addToCart = async (itemId, size) => {
        if (!size) { // Check if size is selected
            toast.error('Select Product Size');
            return;
        }

        // Clone cartItems and update the quantity for the selected item and size
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
        } else {
            cartData[itemId] = { [size]: 1 };
        }
        setCartItems(cartData); // Update the cartItems state

        // Save cart item to backend if token is available
        if (token) {
            try {
                await axios.post(`${backendUrl}/api/cart/add`, { itemId, size }, { headers: { token } });
            } catch (error) {
                console.log(error);
                toast.error(error.message);
            }
        }
    };

    // Function to calculate total number of items in the cart
    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {
                    console.log("error");
                }
            }
        }
        return totalCount;
    };

    // Function to update the quantity of a specific item in the cart
    const updateQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId][size] = quantity;
        setCartItems(cartData); // Update cartItems state

        // Update cart item on backend if token is available
        if (token) {
            try {
                await axios.post(`${backendUrl}/api/cart/update`, { itemId, size, quantity }, { headers: { token } });
            } catch (error) {
                console.log(error);
                toast.error(error.message);
            }
        }
    };

    // Function to calculate total cart amount
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalAmount += itemInfo.price * cartItems[items][item];
                    }
                } catch (error) {
                    console.log("error");
                }
            }
        }
        return totalAmount;
    };

    // Function to fetch products data from backend
    const getProductsData = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/product/list`);
            if (response.data.success) {
                setProducts(response.data.products.reverse()); // Reverse to show latest products first
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    // Function to fetch user's cart data from backend
    const getUserCart = async (token) => {
        try {
            const response = await axios.post(`${backendUrl}/api/cart/get`, {}, { headers: { token } });
            if (response.data.success) {
                setCartItems(response.data.cartData);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    // Fetch products data when component mounts
    useEffect(() => {
        getProductsData();
    }, []);

    // Fetch user cart data if token is available or changes
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (!token && storedToken) {
            setToken(storedToken);
            getUserCart(storedToken);
        } else if (token) {
            getUserCart(token);
        }
    }, [token]);

    // Define the value to be provided to components within ShopContext
    const value = {
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart, setCartItems,
        getCartCount, updateQuantity,
        getCartAmount, navigate, backendUrl,
        setToken, token
    };

    // Provide the ShopContext to child components
    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;
