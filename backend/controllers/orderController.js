import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe';
import razorpay from 'razorpay';

// Global variables
const currency = 'usd'; // Default currency for payments
const deliveryCharge = 10; // Delivery charge for the order

// Gateway initialization for Stripe and Razorpay
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Initializing Stripe with secret key

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, 
    key_secret: process.env.RAZORPAY_KEY_SECRET, 
});

// Placing orders using COD (Cash on Delivery) method
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body; // Destructuring order details from request body

        // Preparing order data
        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "COD",
            payment: false, 
            date: Date.now(), 
        };

        // Saving the order to the database
        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // Clearing the user's cart after order is placed
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // Sending success response
        res.json({ success: true, message: "Order Placed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); // Sending error response
    }
};

// Placing orders using Stripe payment method
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body; // Destructuring order details from request body
        const { origin } = req.headers; // Get the origin (to create redirect URLs)

        // Preparing order data
        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "Stripe", 
            payment: false, 
            date: Date.now(),
        };

        // Saving the order to the database
        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // Creating line items for Stripe checkout session
        const line_items = items.map((item) => ({
            price_data: {
                currency: currency, // Using global currency variable
                product_data: {
                    name: item.name, // Name of the product
                },
                unit_amount: item.price * 100, // Amount in cents
            },
            quantity: item.quantity, // Quantity of the item
        }));

        // Adding delivery charge as a line item
        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: 'Delivery Charges',
                },
                unit_amount: deliveryCharge * 100, // Delivery charge in cents
            },
            quantity: 1,
        });

        // Creating Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`, // URL for successful payment
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`, // URL for cancelled payment
            line_items,
            mode: 'payment', // Payment mode for Stripe
        });

        // Sending session URL for frontend redirection
        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); // Sending error response
    }
};

// Verifying Stripe payment status
const verifyStripe = async (req, res) => {
    const { orderId, success, userId } = req.body; // Destructuring verification details

    try {
        if (success === "true") {
            // Mark payment as successful
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            await userModel.findByIdAndUpdate(userId, { cartData: {} }); // Clear user's cart
            res.json({ success: true });
        } else {
            // Delete the order if payment failed
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); // Sending error response
    }
};

// Placing orders using Razorpay payment method
const placeOrderRazorpay = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body; // Destructuring order details

        // Preparing order data
        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "Razorpay", // Payment method as Razorpay
            payment: false,
            date: Date.now(),
        };

        // Saving the order to the database
        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // Preparing Razorpay order options
        const options = {
            amount: amount * 100, // Amount in paisa
            currency: currency.toUpperCase(), // Using global currency
            receipt: newOrder._id.toString(), // Receipt as order ID
        };

        // Creating Razorpay order
        await razorpayInstance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.json({ success: false, message: error }); // Sending error response
            }
            res.json({ success: true, order }); // Sending success response with Razorpay order details
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); // Sending error response
    }
};

// Verifying Razorpay payment status
const verifyRazorpay = async (req, res) => {
    try {
        const { userId, razorpay_order_id } = req.body; // Destructuring verification details

        // Fetching Razorpay order details
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
        if (orderInfo.status === 'paid') {
            // Mark payment as successful
            await orderModel.findByIdAndUpdate(orderInfo.receipt, { payment: true });
            await userModel.findByIdAndUpdate(userId, { cartData: {} }); // Clear user's cart
            res.json({ success: true, message: "Payment Successful" });
        } else {
            res.json({ success: false, message: 'Payment Failed' }); // Sending failure response
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); // Sending error response
    }
};

// Fetch all orders for admin panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}); // Fetch all orders from the database
        res.json({ success: true, orders }); // Sending orders data
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); // Sending error response
    }
};

// Fetch user-specific orders for frontend
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body; // Destructuring userId from request body

        const orders = await orderModel.find({ userId }); // Fetch orders for the specific user
        res.json({ success: true, orders }); // Sending user's order data
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); // Sending error response
    }
};

// Update order status from admin panel
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body; // Destructuring order details

        await orderModel.findByIdAndUpdate(orderId, { status }); // Updating order status
        res.json({ success: true, message: 'Status Updated' }); // Sending success response
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); // Sending error response
    }
};

export {
    verifyRazorpay,
    verifyStripe,
    placeOrder,
    placeOrderStripe,
    placeOrderRazorpay,
    allOrders,
    userOrders,
    updateStatus,
};
