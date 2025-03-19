import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import designerRoutes from "./routes/designer.routes.js";
import orderRoutes from "./routes/order.routes.js";
import virtualFittingRoutes from "./routes/virtualFitting.routes.js";
// import aiSuggestionRoutes from "./routes/aiSuggestion.routes.js"
import customDesignRoutes from "./routes/customDesign.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Production CORS settings - replace with your actual production domain
const productionOrigin = process.env.PROD_ORIGIN || "https://your-production-domain.com"; // or http://

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if the origin is in the allowed list
        const allowedOrigins = [
            "http://localhost:3000", // Development
            productionOrigin          // Production
        ];

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: "GET,POST,PUT,DELETE,PATCH",
    credentials: true // Allow cookies & authorization headers
}));


app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({extended: true, limit: "50mb"}));

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Kimelia Luxe API",
            version: "1.0.0",
            description: "Kimelia Luxe Fashion Platform API Documentation",
            contact: {
                name: "API Support",
                email: "support@kimelialuxe.com"
            }
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: "Development server"
            },
            {
                url: process.env.PROD_URL,  // Add production URL, if you have one
                description: "Production server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: [join(__dirname, './routes/*.js'), join(__dirname, './models/*.js')]  // Use absolute paths to your routes and models
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/designers", designerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/virtual-fitting", virtualFittingRoutes);
// app.use("/api/ai-suggestions", aiSuggestionRoutes);
app.use("/api/custom-designs", customDesignRoutes);
app.use("/api/payments", paymentRoutes);

// Root route
app.get("/", (req, res) => {
    res.send("Welcome to Kimelia Luxe API");
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
        });
    })
    .catch(error => {
       console.error("MongoDB connection error:", error.message); // Log detailed error message
       console.error("MongoDB connection error:", error);

        // Optionally, you might want to handle the error more gracefully, such as sending an error response to the client or retrying the connection:
        // res.status(500).send("Failed to connect to MongoDB. Please check the server logs.");
    });

export default app;
