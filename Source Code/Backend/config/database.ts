import mongoose from "mongoose";

export const connect = async (): Promise<void> => {
  try {
    mongoose.connect(process.env.MONGO_URI);
    console.log("Connect Database Success!");
  } catch (error) {
    console.log("Connect Database Error!");
  }
};
