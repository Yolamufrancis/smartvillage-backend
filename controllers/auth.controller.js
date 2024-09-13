import User from "../models/user.model.js";
import errorHandler from "../utils/error.js";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

// User signup function
export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = bcryptjs.hashSync(password, 10);

    // Create a new user
    const newUser = new User({ username, email, password: hashedPassword });

    await newUser.save();
    res.status(201).json({ success: true, message: "User created successfully" });
  } catch (error) {
    // Check if it's a validation error
    if (error.name === "ValidationError") {
      res.status(400).json({ success: false, message: error.message });
    } else {
      // For other errors, forward to the error middleware
      next(error);
    }
  }
};

// User sign-in function
export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, "User does not exist"));

    // Compare the provided password with the hashed password stored in the database
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, "Wrong credentials"));

    // Generate JWT token for authentication
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);

    // Avoid sending password back to the user
    const { password: pass, ...rest } = validUser._doc;

    // Set the token in a cookie and send the user data along with the response
    res.cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

// Google OAuth sign-in/signup function
export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = user._doc;
      res.cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json(rest);
    } else {
      const generatedPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      const newUser = new User({
        username: req.body.name.split(" ").join("").toLowerCase() + Math.random().toString(36).slice(-4),
        email: req.body.email,
        password: hashedPassword,
        avatar: req.body.photo,
      });
      await newUser.save();
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = newUser._doc;
      res.cookie("access_token", token, { httOnly: true })
        .status(200)
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};

// User sign-out function
export const signOut = async (req, res, next) => {
  try {
    res.clearCookie('access_token');
    res.status(200).json('User has been logged out!');
  } catch (error) {
    next(error);
  }
};
