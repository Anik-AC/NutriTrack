import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

jest.mock("mongoose"); // Mock mongoose methods

describe("Database Connection", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should connect to MongoDB successfully", async () => {
    mongoose.connect.mockResolvedValue({
      connection: { host: "mocked_host" },
    });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
    expect(consoleSpy).toHaveBeenCalledWith("MongoDB Connected: mocked_host");

    consoleSpy.mockRestore();
  });

  it("should log and rethrow the error on failure", async () => {
    const errorMessage = "Connection failed";
    mongoose.connect.mockRejectedValue(new Error(errorMessage));

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // connectDB rethrows (it does NOT call process.exit — that would kill a
    // serverless function on Vercel); the caller decides how to handle it.
    await expect(connectDB()).rejects.toThrow(errorMessage);

    expect(consoleErrorSpy).toHaveBeenCalledWith(`MongoDB connection error: ${errorMessage}`);

    consoleErrorSpy.mockRestore();
  });
});
