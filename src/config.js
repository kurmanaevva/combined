import mongoose from "mongoose";

// Connect to Login/Signup Database
const userDB = mongoose.createConnection("mongodb://127.0.0.1:27017/Login-tut", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
userDB.once("open", () => console.log("Connected to Login/Signup Database"));

// User Schema & Model (Stored in `userDB`)
const LoginSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true }
});
export const UserCollection = userDB.model("users", LoginSchema);

// Connect to Blog CRUD Database
const blogDB = mongoose.createConnection("mongodb://127.0.0.1:27017/blogDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
blogDB.once("open", () => console.log("Connected to Blog CRUD Database"));

// Blog Schema & Model (Stored in `blogDB`)
const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    author: { type: String, default: "Anonymous" },
    createdAt: { type: Date, default: Date.now }
});
export const BlogCollection = blogDB.model("blogs", BlogSchema);
