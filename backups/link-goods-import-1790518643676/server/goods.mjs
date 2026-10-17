import {pool} from './db.mjs';
import {bad,name,id,units,decimal,date,periodRange,currency} from './material-domain.mjs';
export async function initializeGoods(){
 await pool.query('CREATE TABLE IF NOT EXISTS goods_categories (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE) ENGINE=InnoDB');
 await pool.query('CREATE TABLE IF NOT EXISTS goods (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE, category_id INT UNSIGNED NOT NULL, unit VARCHAR(12) NOT NULL, unit_cost DECIMAL(11,3) NOT NULL, currency ENUM(\'USD\',\'KRW\') NOT NULL DEFAULT \'USD\', FOREIGN KEY(category_id) REFERENCES goods_categories(id) ON DELETE RESTRICT) ENGINE=InnoDB');
 await pool.query('CREATE TABLE IF NOT EXISTS goods_usage (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, goods_id INT UNSIGNED NOT NULL, used_on DATE NOT NULL, quantity DECIMAL(11,3) NOT NULL, unit_cost DECIMAL(11,3) NOT NULL, currency ENUM(\'USD\',\'KRW\') NOT NULL DEFAULT \'USD\', note VARCHAR(250) NOT NULL DEFAULT \'\', recorded_by INT UNSIGNED NOT NULL, INDEX(used_on,goods_id), FOREIGN KEY(goods_id) REFERENCES goods(id) ON DELETE RESTRICT) ENGINE=InnoDB');
 // Existing goods costs and usage were confirmed to be US dollars.
 for(const table of ['goods','goods_usage']){
  const [columns]=await pool.query('SHOW COLUMNS FROM '+table+" LIKE 'currency'");
  if(!columns.length)await pool.query('ALTER TABLE '+table+" ADD COLUMN currency ENUM('USD','KRW') NOT NULL DEFAULT 'USD' AFTER unit_cost");
 }
}
export async function goodsRoute(req,user,body){
 const url=new URL(req.url,'http://localhost'), path=url.pathname, method=req.method;
 if(path==='/api/goods/catalog' && method==='GET'){
  const [categories]=await pool.query('SELECT c.*, (SELECT COUNT(*) FROM goods m WHERE m.category_id=c.id) AS goods_count FROM goods_categories c ORDER BY c.name');
  const [goods]=await pool.query('SELECT m.*, c.name AS category_name FROM goods m JOIN goods_categories c ON c.id=m.category_id ORDER BY m.name');return {categories,goods};
 }
 if(path==='/api/goods/statistics' && method==='GET'){
  const {start,end}=periodRange(url.searchParams.get('period'),url.searchParams.get('date'));
  const selected=url.searchParams.get('goods');const params=[start,end];let filter='';if(selected){filter=' AND u.goods_id=?';params.push(id(selected));}
  const [summary]=await pool.execute(`SELECT m.id,m.name,m.unit,u.currency,SUM(u.quantity) AS quantity,SUM(u.quantity*u.unit_cost) AS total_cost FROM goods_usage u JOIN goods m ON m.id=u.goods_id WHERE u.used_on>=? AND u.used_on<? ${filter} GROUP BY m.id,m.name,m.unit,u.currency ORDER BY m.name,u.currency`,params);
  const [history]=await pool.execute(`SELECT u.*,m.name,m.unit FROM goods_usage u JOIN goods m ON m.id=u.goods_id WHERE u.used_on>=? AND u.used_on<? ${filter} ORDER BY u.used_on DESC,u.id DESC LIMIT 200`,params);
  return {summary,history,start,end};
 }
 const match=path.match(/^\/api\/goods\/(categories|items|usage)(?:\/(\d+))?$/);if(!match)bad('Not found.',404);
 const type=match[1],recordId=match[2]?id(match[2]):null;
 if(!((method==='POST'&&!recordId) || (['PUT','DELETE'].includes(method)&&recordId)) || (type==='usage'&&method==='PUT'))bad('Not found.',404);
 const data=method==='DELETE'?{}:await body(req);
 const c=await pool.getConnection();
 try{
  await c.beginTransaction();
  // Serialize changes with usage snapshots and unit edits.
  await c.query('SELECT id FROM management_lock WHERE id=1 FOR UPDATE');
  if(type==='categories'){
   if(method==='POST')await c.execute('INSERT INTO goods_categories (name) VALUES (?)',[name(data.name)]);
   else {const [rows]=await c.execute('SELECT id FROM goods_categories WHERE id=?',[recordId]);if(!rows.length)bad('Category not found.',404);if(method==='PUT')await c.execute('UPDATE goods_categories SET name=? WHERE id=?',[name(data.name),recordId]);else await c.execute('DELETE FROM goods_categories WHERE id=?',[recordId]);}
  }else if(type==='items'){
   let existing;if(recordId){const [rows]=await c.execute('SELECT * FROM goods WHERE id=?',[recordId]);existing=rows[0];if(!existing)bad('Goods not found.',404);}
   if(method==='DELETE')await c.execute('DELETE FROM goods WHERE id=?',[recordId]);
   else{
    const goodsName=name(data.name),category=id(data.category_id),cost=decimal(data.unit_cost),costCurrency=currency(data.currency);
    if(!units.includes(data.unit))bad('Choose a valid unit.');
    const [categoryRows]=await c.execute('SELECT id FROM goods_categories WHERE id=?',[category]);if(!categoryRows.length)bad('Choose an existing category.');
    if(existing && existing.unit!==data.unit){const [used]=await c.execute('SELECT id FROM goods_usage WHERE goods_id=? LIMIT 1',[recordId]);if(used.length)bad('Unit cannot change after usage is recorded. Create a separate goods for the new unit.');}
    if(method==='POST')await c.execute('INSERT INTO goods (name,category_id,unit,unit_cost,currency) VALUES (?,?,?,?,?)',[goodsName,category,data.unit,cost,costCurrency]);
    else await c.execute('UPDATE goods SET name=?,category_id=?,unit=?,unit_cost=?,currency=? WHERE id=?',[goodsName,category,data.unit,cost,costCurrency,recordId]);
   }
  }else if(method==='DELETE'){
   const [result]=await c.execute('DELETE FROM goods_usage WHERE id=?',[recordId]);if(!result.affectedRows)bad('Usage record not found.',404);
  }else{
   const goodsId=id(data.goods_id),usedOn=date(data.used_on),quantity=decimal(data.quantity,true);
   if(usedOn>new Date().toISOString().slice(0,10))bad('Usage date cannot be in the future.');
   const note=String(data.note || '').trim();if(note.length>250)bad('Note is limited to 250 characters.');
   const [rows]=await c.execute('SELECT unit_cost,currency FROM goods WHERE id=?',[goodsId]);if(!rows.length)bad('Choose an existing goods.');
   if(!rows[0].currency)bad('Set this goods’s cost currency before recording usage.');
   await c.execute('INSERT INTO goods_usage (goods_id,used_on,quantity,unit_cost,currency,note,recorded_by) VALUES (?,?,?,?,?,?,?)',[goodsId,usedOn,quantity,rows[0].unit_cost,rows[0].currency,note,user.id]);
  }
  await c.commit();return {ok:true};
 }catch(error){await c.rollback();if(error.code==='ER_DUP_ENTRY')bad('That name already exists.',409);if(error.code==='ER_ROW_IS_REFERENCED_2')bad('This record is in use. Categories with goods and goods with usage history cannot be deleted.',409);throw error;}finally{c.release();}
}
