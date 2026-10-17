import mysql from 'mysql2/promise';
import {permissions} from './domain.mjs';
export const pool = mysql.createPool({host:process.env.DB_HOST || '127.0.0.1',port:Number(process.env.DB_PORT || 3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME || 'songam_restaurant',dateStrings:true,connectionLimit:5,connectTimeout:5000});
export async function initialize() {
 await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE, password_hash VARCHAR(200) NOT NULL, job ENUM('cooker','manager','worker','servicer','guider') NOT NULL, birthday DATE NOT NULL) ENGINE=InnoDB`);
 await pool.query('CREATE TABLE IF NOT EXISTS user_abilities (user_id INT UNSIGNED PRIMARY KEY, abilities JSON NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB');
 for(const [job,ability] of Object.entries(permissions)) await pool.execute('INSERT IGNORE INTO user_abilities (user_id,abilities) SELECT id,? FROM users WHERE job=?',[JSON.stringify(ability),job]);
 await pool.query(`CREATE TABLE IF NOT EXISTS sessions (token_hash CHAR(64) PRIMARY KEY, user_id INT UNSIGNED NOT NULL, expires_at DATETIME NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB`);
 await pool.query(`CREATE TABLE IF NOT EXISTS user_logs (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, actor VARCHAR(254) NOT NULL, action VARCHAR(30) NOT NULL, subject VARCHAR(254) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`);
 await pool.query(`CREATE TABLE IF NOT EXISTS management_lock (id INT PRIMARY KEY) ENGINE=InnoDB`);
 await pool.query('INSERT IGNORE INTO management_lock (id) VALUES (1)');
}
