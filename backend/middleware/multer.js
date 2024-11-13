import multer from "multer";

// Define the storage settings for multer
const storage = multer.diskStorage({
    // Set the filename for uploaded files
    filename: function(req, file, callback) {
        // Use the original file name for storage
        callback(null, file.originalname);
    }
});

// Create an instance of multer with the defined storage settings
const upload = multer({ storage });

// Export the upload middleware to be used in routes
export default upload;
