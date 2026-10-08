import mongoose from "mongoose";

const DEFAULT_MONGODB_URI = "mongodb://localhost:27017/event_management";

export async function connectDatabase(
  uri: string = process.env["MONGODB_URI"] ?? DEFAULT_MONGODB_URI,
): Promise<typeof mongoose> {
  console.log("Connecting to MongoDb")
  try {
    mongoose.connection.on("connected", () => {
      console.log("Connected to MongoDB successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB connection disconnected");
    });
    await mongoose.connect(uri);
    return mongoose;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error disconnecting from MongoDB", error);
    throw error;
  }
}
