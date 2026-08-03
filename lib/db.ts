import mongoose from "mongoose";

const MONGO_URI = process.env.DB_URI || "";

const ConnectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log("Database is already connected");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};

export default ConnectDB;
