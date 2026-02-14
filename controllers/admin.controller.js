import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../database/db.js";
import { uploadToS3 } from "../services/awsS3.service.js";



/* REGISTER ADMIN */
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, address, bio } = req.body;

    const hash = await bcrypt.hash(password, 10);

    let imageUrl = null;

    // Upload profile image if exists
    if (req.file) {
      const key = `admins/${Date.now()}_${req.file.originalname}`;
      imageUrl = await uploadToS3(req.file, key);
    }

    await db.query(
      `INSERT INTO admins(name,email,password,phone,address,bio,profile_image)
       VALUES (?,?,?,?,?,?,?)`,
      [name, email, hash, phone, address, bio, imageUrl]
    );

    res.json({ message: "Admin registered" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Registration failed" });
  }
};



/* LOGIN ADMIN */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM admins WHERE email=?",
      [email]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Admin not found" });

    const admin = rows[0];

    const valid = await bcrypt.compare(password, admin.password);

    if (!valid)
      return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: admin.admin_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🔥 RETURN TOKEN IN RESPONSE (NO COOKIE)
    res.status(200).json({
      message: "Login success",
      token,
      admin: {
        id: admin.admin_id,
        email: admin.email,
        name: admin.name
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Login failed" });
  }
};



/* GET PROFILE */
export const getAdminProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT admin_id,name,email,phone,address,bio,profile_image,created_at
       FROM admins WHERE admin_id=?`,
      [req.admin.id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Admin not found" });

    res.json(rows[0]);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};



/* UPDATE PROFILE */
export const updateAdminProfile = async (req, res) => {
  try {
    const { name, phone, address, bio } = req.body;

    let imageUrl = null;

    // If new image uploaded
    if (req.file) {
      const key = `admins/${Date.now()}_${req.file.originalname}`;
      imageUrl = await uploadToS3(req.file, key);
    }

    if (imageUrl) {
      await db.query(
        `UPDATE admins 
         SET name=?, phone=?, address=?, bio=?, profile_image=? 
         WHERE admin_id=?`,
        [name, phone, address, bio, imageUrl, req.admin.id]
      );
    } else {
      await db.query(
        `UPDATE admins 
         SET name=?, phone=?, address=?, bio=? 
         WHERE admin_id=?`,
        [name, phone, address, bio, req.admin.id]
      );
    }

    res.json({ message: "Profile updated" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Profile update failed" });
  }
};



export const logoutAdmin = async (req, res) => {
  try {

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });

    res.json({ message: "Logout success" });

  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
};
