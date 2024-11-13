import jwt from 'jsonwebtoken';

// Middleware function to authenticate admin users
const adminAuth = async (req, res, next) => {
    try {
        // Retrieve the token from request headers
        const { token } = req.headers;

        // Check if the token exists
        if (!token) {
            return res.json({ success: false, message: "Not Authorized. Login Again" });
        }

        // Decode and verify the token using the secret key
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);

        // Verify if the decoded token matches the admin credentials
        if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            return res.json({ success: false, message: "Not Authorized. Login Again" });
        }

        // If authorization is successful, proceed to the next middleware or route
        next();
    } catch (error) {
        // Handle any errors and send a response with the error message
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export default adminAuth;
