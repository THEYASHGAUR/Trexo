// Importing required modules and dependencies
import express from 'express'; 
import cors from 'cors'; // CORS middleware to handle cross-origin requests
import 'dotenv/config'; // Loads environment variables from a .env file
import connectDB from './config/mongodb.js'; 
import connectCloudinary from './config/cloudinary.js'; 
import userRouter from './routes/userRoute.js'; 
import productRouter from './routes/productRoute.js'; 
import cartRouter from './routes/cartRoute.js'; 
import orderRouter from './routes/orderRoute.js';

// App Config - Initializes express app and connects to database and cloud services
const app = express(); // Create an express app
const port = process.env.PORT || 4000; // Set the port to the value from .env or 4000 by default
connectDB(); // Connect to MongoDB
connectCloudinary(); // Connect to Cloudinary for media handling

// Middlewares
app.use(express.json()); // Middleware to parse incoming JSON requests
app.use(cors()); // Middleware to enable CORS for handling requests from different origins

// API Endpoints - Defining routes for different parts of the app
app.use('/api/user', userRouter); // Routes for user-related operations (e.g., registration, login)
app.use('/api/product', productRouter); // Routes for product-related operations (e.g., listing, details)
app.use('/api/cart', cartRouter); // Routes for cart-related operations (e.g., add to cart, view cart)
app.use('/api/order', orderRouter); // Routes for order-related operations (e.g., placing an order, viewing orders)

// Root route - Simple endpoint to check if the API is working
app.get('/', (req, res) => {
    res.send("API Working"); // Sends a message to confirm the API is working
});

// Starting the server and listening on the specified port
app.listen(port, () => console.log('Server started on PORT : ' + port)); // Log message when server starts
