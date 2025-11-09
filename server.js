import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error(err));

// User schema with role
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// Demand schema
const demandSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  budget: String,
  deadline: Date,
  contactPreference: { type: String, default: 'email' },
  status: { type: String, enum: ['en-attente', 'en-cours', 'terminee', 'annulee'], default: 'en-attente' },
  files: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Demand = mongoose.model("Demand", demandSchema);

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ msg: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ msg: "Invalid token" });
    req.user = user;
    next();
  });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: "Admin access required" });
  }
  next();
};

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash, phone, role: 'user' });

    res.json({ msg: "Registration successful" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Login endpoint - around line 73
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid password" });

    // IMPORTANT: Ensure role exists, default to 'user' if missing
    const userRole = user.role || 'user';

    console.log('User logging in:', { 
      email: user.email, 
      role: userRole, 
      name: user.name 
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: userRole, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    res.json({ 
      msg: "Login successful", 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole,  // Use the validated role
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get current user profile
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ==================== DEMAND ROUTES ====================

// Create demand
app.post("/api/demands", authenticateToken, async (req, res) => {
  try {
    const { title, category, description, budget, deadline, contactPreference, files } = req.body;
    
    if (!title || !category || !description) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const demand = await Demand.create({
      userId: req.user.id,
      title,
      category,
      description,
      budget,
      deadline,
      contactPreference,
      files: files || []
    });

    res.json({ msg: "Demand created successfully", demand });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get user's demands
app.get("/api/demands", authenticateToken, async (req, res) => {
  try {
    const demands = await Demand.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(demands);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Update demand
app.put("/api/demands/:id", authenticateToken, async (req, res) => {
  try {
    const demand = await Demand.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!demand) return res.status(404).json({ msg: "Demand not found" });

    const updates = req.body;
    updates.updatedAt = Date.now();
    
    Object.assign(demand, updates);
    await demand.save();

    res.json({ msg: "Demand updated successfully", demand });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete demand
app.delete("/api/demands/:id", authenticateToken, async (req, res) => {
  try {
    const demand = await Demand.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!demand) return res.status(404).json({ msg: "Demand not found" });
    res.json({ msg: "Demand deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get user statistics
app.get("/api/statistics", authenticateToken, async (req, res) => {
  try {
    const total = await Demand.countDocuments({ userId: req.user.id });
    const pending = await Demand.countDocuments({ userId: req.user.id, status: 'en-attente' });
    const inProgress = await Demand.countDocuments({ userId: req.user.id, status: 'en-cours' });
    const completed = await Demand.countDocuments({ userId: req.user.id, status: 'terminee' });
    const cancelled = await Demand.countDocuments({ userId: req.user.id, status: 'annulee' });

    res.json({ total, pending, inProgress, completed, cancelled });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all demands (Admin only)
app.get("/api/admin/demands", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const demands = await Demand.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Demand.countDocuments(query);

    res.json({
      demands,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ⭐ GET SINGLE DEMAND (Admin only) - ADD THIS BEFORE THE GENERAL GET ROUTE
app.get("/api/admin/demands/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Admin fetching demand:', req.params.id);
    
    const demand = await Demand.findById(req.params.id)
      .populate('userId', 'name email phone');
    
    if (!demand) {
      console.log('Demand not found:', req.params.id);
      return res.status(404).json({ msg: "Demand not found" });
    }
    
    console.log('Demand found:', demand);
    res.json(demand);
  } catch (err) {
    console.error('Error fetching demand:', err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all users (Admin only)
app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Update demand status (Admin only)
app.patch("/api/admin/demands/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['en-attente', 'en-cours', 'terminee', 'annulee'].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const demand = await Demand.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate('userId', 'name email phone');

    if (!demand) return res.status(404).json({ msg: "Demand not found" });
    res.json({ msg: "Status updated successfully", demand });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get admin dashboard statistics
app.get("/api/admin/statistics", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalDemands = await Demand.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const pendingDemands = await Demand.countDocuments({ status: 'en-attente' });
    const inProgressDemands = await Demand.countDocuments({ status: 'en-cours' });
    const completedDemands = await Demand.countDocuments({ status: 'terminee' });
    const cancelledDemands = await Demand.countDocuments({ status: 'annulee' });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDemands = await Demand.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });

    res.json({
      totalDemands,
      totalUsers,
      pendingDemands,
      inProgressDemands,
      completedDemands,
      cancelledDemands,
      recentDemands
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get single demand (User - must be AFTER admin routes)
app.get("/api/demands/:id", authenticateToken, async (req, res) => {
  try {
    const demand = await Demand.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!demand) return res.status(404).json({ msg: "Demand not found" });
    res.json(demand);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
app.use(cors({
  origin: [
    'https://your-actual-netlify-site.netlify.app',  // ← Replace with YOUR Netlify URL
    'http://localhost:3000',  // For local testing
    'http://127.0.0.1:5500'   // For Live Server
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
