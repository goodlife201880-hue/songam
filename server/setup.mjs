import {pool,initialize} from './db.mjs';
import {validate,hashPassword} from './domain.mjs';
try {
 await initialize();
 const data=validate({name:process.env.MANAGER_NAME,email:process.env.MANAGER_EMAIL,password:process.env.MANAGER_PASSWORD,birthday:process.env.MANAGER_BIRTHDAY,job:'manager'});
 const passwordHash=await hashPassword(data.password);
 const connection=await pool.getConnection();
 try { await connection.beginTransaction(); await connection.query('SELECT id FROM management_lock WHERE id=1 FOR UPDATE'); const [rows]=await connection.query('SELECT id FROM users LIMIT 1'); if(rows.length) throw new Error('Setup is only allowed for an empty user database.'); await connection.execute('INSERT INTO users (name,email,password_hash,job,birthday) VALUES (?,?,?,?,?)',[data.name,data.email,passwordHash,data.job,data.birthday]); await connection.commit(); console.log('Initial manager created. Remove MANAGER_PASSWORD from .env now.'); } catch(error) {await connection.rollback(); throw error;} finally {connection.release();}
} catch(error) {console.error(error.message);process.exitCode=1;} finally {await pool.end();}
