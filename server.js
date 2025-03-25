import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import designerRoutes from "./routes/designer.routes.js";
import orderRoutes from "./routes/order.routes.js";
import virtualFittingRoutes from "./routes/virtualFitting.routes.js";
// import aiSuggestionRoutes from "./routes/aiSuggestion.routes.js";
import customDesignRoutes from "./routes/customDesign.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Handle CORS
app.options("*", cors()); // Handles preflight requests
app.use(
  cors({
    origin: "http://localhost:3000", // Change to your frontend URL in production
    credentials: true,
  })
);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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
        email: "support@kimelialuxe.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
      {
        url: process.env.PROD_URL || "", // Ensure it does not break if undefined
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [join(__dirname, "routes/*.js"), join(__dirname, "models/*.js")], // Use absolute paths
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

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "";
if (!MONGODB_URI) {
  console.error("MongoDB URI is missing in environment variables.");
  process.exit(1); // Exit if no database URL is set
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

export default app;
