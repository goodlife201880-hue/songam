import {pool} from './db.mjs';
import {bad,date} from './material-domain.mjs';
import {exportPrice,exportTotals} from '../shared/export-price.mjs';
export async function initializeExports(){
 await pool.query(`CREATE TABLE IF NOT EXISTS sales_exports (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,exported_on DATE NOT NULL,export_type ENUM('food','goods') NOT NULL,recorded_by INT UNSIGNED NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`);
 await pool.query(`CREATE TABLE IF NOT EXISTS sales_export_items (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,export_id INT UNSIGNED NOT NULL,item_type ENUM('food','goods') NOT NULL,food_id INT UNSIGNED NULL,goods_id INT UNSIGNED NULL,name VARCHAR(120) NOT NULL,quantity DECIMAL(11,3) NOT NULL,unit VARCHAR(12) NOT NULL,unit_price DECIMAL(11,3) NOT NULL,price_unit VARCHAR(12) NOT NULL,total_price DECIMAL(11,3) NOT NULL,currency ENUM('USD','KRW') NOT NULL,FOREIGN KEY(export_id) REFERENCES sales_exports(id) ON DELETE CASCADE,FOREIGN KEY(food_id) REFERENCES foods(id) ON DELETE SET NULL,FOREIGN KEY(goods_id) REFERENCES goods(id) ON DELETE SET NULL) ENGINE=InnoDB`);
}
export async function exportRoute(req,user,body){
 const url=new URL(req.url,'http://localhost'),path=url.pathname,method=req.method;
 const type=url.searchParams.get('type');
 if(!['food','goods'].includes(type))bad('Choose Food export or Goods export.');
 if(!((path==='/api/exports/catalog'&&method==='GET')||(path==='/api/exports/sales'&&['GET','POST'].includes(method))))bad('Not found.',404);
 const data=method==='POST'?await body(req):null,c=await pool.getConnection();
 try{
  await c.beginTransaction();
  if(path==='/api/exports/sales'&&method==='GET'){
   const [sales]=await c.execute('SELECT id,exported_on FROM sales_exports WHERE export_type=? ORDER BY exported_on DESC,id DESC LIMIT 100',[type]);
   let items=[];if(sales.length)[items]=await c.query('SELECT * FROM sales_export_items WHERE export_id IN (?) ORDER BY id',[sales.map(row=>row.id)]);
   await c.commit();return {exports:sales.map(sale=>{const rows=items.filter(row=>row.export_id===sale.id);return {...sale,items:rows,totals:exportTotals(rows)};})};
  }
  if(method==='POST')await c.query('SELECT id FROM management_lock WHERE id=1 FOR UPDATE');
  const [foods]=await c.query('SELECT id,name,serving_price,currency FROM foods ORDER BY name');
  const [goods]=await c.query('SELECT id,name,category_id,unit,unit_cost,currency FROM goods ORDER BY name');
  if(method==='GET'){
   const [categories]=await c.query('SELECT id,name FROM goods_categories ORDER BY name');
   await c.commit();return {foods,goods,categories};
  }
  if(!data||!Array.isArray(data.items)||!data.items.length||data.items.length>50)bad('Add between 1 and 50 foods or goods.');
  const exportedOn=date(data.exported_on);if(exportedOn>new Date().toISOString().slice(0,10))bad('Export date cannot be in the future.');
  if(data.items.some(row=>!row||row.type!==type))bad('Each export must contain only '+type+'.');
  const lines=data.items.map(row=>exportPrice(row,foods,goods));
  const [result]=await c.execute('INSERT INTO sales_exports (exported_on,export_type,recorded_by) VALUES (?,?,?)',[exportedOn,type,user.id]);
  for(const row of lines)await c.execute('INSERT INTO sales_export_items (export_id,item_type,food_id,goods_id,name,quantity,unit,unit_price,price_unit,total_price,currency) VALUES (?,?,?,?,?,?,?,?,?,?,?)',[result.insertId,row.type,row.type==='food'?row.item_id:null,row.type==='goods'?row.item_id:null,row.name,row.quantity,row.unit,row.unit_price,row.price_unit,row.total_price,row.currency]);
  await c.commit();return {ok:true,id:result.insertId,totals:exportTotals(lines)};
 }catch(error){await c.rollback();throw error;}finally{c.release();}
}
