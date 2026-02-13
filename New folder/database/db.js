import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

export const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})


export const checkDBConnection = async () => {
    try {
        const connection = await db.getConnection();
        console.log("✅ MySQL Connected Successfully!");
        connection.release();
    } catch (error) {
        console.error("❌ MySQL Connection Failed:", error.message);
        process.exit(1);
    }
};

