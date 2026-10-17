import {pool} from './db.mjs';
import {bad,id,date,decimal,currency,name} from './material-domain.mjs';
import {compatibleUnits} from '../shared/food-cost.mjs';
export function validateImport(data,materials){
 if(!data||!Array.isArray(data.items)||!data.items.length||data.items.length>50)bad('Add between 1 and 50 materials.');
 const importedOn=date(data.imported_on);if(importedOn>new Date().toISOString().slice(0,10))bad('Import date cannot be in the future.');
 const items=data.items.map(row=>{
  if(!row||typeof row!=='object')bad('Enter a valid material row.');
  const material=materials.find(m=>m.id===id(row.material_id));if(!material)bad('Choose an existing material.');
  if(!compatibleUnits(material.unit).includes(row.unit))bad('Choose a compatible unit for '+material.name+'.');
  return {material_id:material.id,material_name:material.name,quantity:decimal(row.quantity,true),unit:row.unit,total_cost:decimal(row.total_cost),currency:currency(row.currency)};
 });
 return {imported_on:importedOn,items};
}
export function validateGoods(data,goods){
 if(!data||!Array.isArray(data.items)||!data.items.length||data.items.length>50)bad('Add between 1 and 50 goods.');
 const importedOn=date(data.imported_on);if(importedOn>new Date().toISOString().slice(0,10))bad('Import date cannot be in the future.');
 const items=data.items.map(row=>{if(!row||typeof row!=='object')bad('Enter a valid goods row.');const item=goods.find(g=>g.id===id(row.goods_id));if(!item)bad('Choose an existing goods item.');if(String(item.category_id)!==String(row.category_id))bad('Choose goods from the selected category.');if(!compatibleUnits(item.unit).includes(row.unit))bad('Choose a compatible goods unit.');return {goods_id:item.id,name:item.name,category_name:item.category_name,unit:row.unit,quantity:decimal(row.quantity,true),total_cost:decimal(row.total_cost),currency:currency(row.currency)};});
 return {imported_on:importedOn,items};
}
export async function initializeImports(){
 await pool.query(`CREATE TABLE IF NOT EXISTS goods_imports (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,imported_on DATE NOT NULL,recorded_by INT UNSIGNED NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`);
 await pool.query(`CREATE TABLE IF NOT EXISTS goods_import_items (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,import_id INT UNSIGNED NOT NULL,name VARCHAR(120) NOT NULL,goods_id INT UNSIGNED NULL,category_name VARCHAR(120) NULL,unit VARCHAR(12) NULL,FOREIGN KEY(goods_id) REFERENCES goods(id) ON DELETE RESTRICT,quantity DECIMAL(11,3) NOT NULL,total_cost DECIMAL(11,3) NOT NULL,currency ENUM('USD','KRW') NOT NULL,FOREIGN KEY(import_id) REFERENCES goods_imports(id) ON DELETE CASCADE) ENGINE=InnoDB`);
 await pool.query(`CREATE TABLE IF NOT EXISTS material_imports (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,imported_on DATE NOT NULL,recorded_by INT UNSIGNED NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`);
 await pool.query(`CREATE TABLE IF NOT EXISTS material_import_items (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,import_id INT UNSIGNED NOT NULL,material_id INT UNSIGNED NOT NULL,material_name VARCHAR(120) NOT NULL,quantity DECIMAL(11,3) NOT NULL,unit VARCHAR(12) NOT NULL,total_cost DECIMAL(11,3) NOT NULL,currency ENUM('USD','KRW') NOT NULL,FOREIGN KEY(import_id) REFERENCES material_imports(id) ON DELETE CASCADE,FOREIGN KEY(material_id) REFERENCES materials(id) ON DELETE RESTRICT) ENGINE=InnoDB`);
}
export async function importRoute(req,user,body){
 const path=new URL(req.url,'http://localhost').pathname,method=req.method;
 if(!((['/api/imports/materials','/api/imports/goods'].includes(path)&&['GET','POST'].includes(method))||(['/api/imports/catalog','/api/imports/goods-catalog'].includes(path)&&method==='GET')))bad('Not found.',404);
 const goods=path==='/api/imports/goods',headerTable=goods?'goods_imports':'material_imports',itemTable=goods?'goods_import_items':'material_import_items';
 const data=method==='POST'?await body(req):null;
 const c=await pool.getConnection();
 try{
  await c.beginTransaction();
  if(path==='/api/imports/goods-catalog'){
   const [categories]=await c.query('SELECT id,name FROM goods_categories ORDER BY name');
   const [goods]=await c.query('SELECT id,name,category_id,unit,currency FROM goods ORDER BY name');
   await c.commit();return {categories,goods};
  }
  if(path==='/api/imports/catalog'){
   const [categories]=await c.query('SELECT id,name FROM material_categories ORDER BY name');
   const [materials]=await c.query('SELECT id,name,category_id,unit,currency FROM materials ORDER BY name');
   await c.commit();return {categories,materials};
  }
  if(method==='GET'){
   const [imports]=await c.query('SELECT id,imported_on FROM '+headerTable+' ORDER BY imported_on DESC,id DESC LIMIT 100');
   let items=[];if(imports.length)[items]=await c.query('SELECT * FROM '+itemTable+' WHERE import_id IN (?) ORDER BY id',[imports.map(row=>row.id)]);
   await c.commit();return {imports:imports.map(row=>({...row,items:items.filter(item=>item.import_id===row.id)}))};
  }
  await c.query('SELECT id FROM management_lock WHERE id=1 FOR UPDATE');
  const [materials]=await c.query('SELECT id,name,unit FROM materials');
  let goodsRows=[];if(goods)[goodsRows]=await c.query('SELECT g.*,c.name AS category_name FROM goods g JOIN goods_categories c ON c.id=g.category_id');
  const value=goods?validateGoods(data,goodsRows):validateImport(data,materials);
  const [result]=await c.execute('INSERT INTO '+headerTable+' (imported_on,recorded_by) VALUES (?,?)',[value.imported_on,user.id]);
  if(goods){for(const row of value.items)await c.execute('INSERT INTO goods_import_items (import_id,goods_id,name,category_name,unit,quantity,total_cost,currency) VALUES (?,?,?,?,?,?,?,?)',[result.insertId,row.goods_id,row.name,row.category_name,row.unit,row.quantity,row.total_cost,row.currency]);}
  else for(const row of value.items)await c.execute('INSERT INTO material_import_items (import_id,material_id,material_name,quantity,unit,total_cost,currency) VALUES (?,?,?,?,?,?,?)',[result.insertId,row.material_id,row.material_name,row.quantity,row.unit,row.total_cost,row.currency]);
  await c.commit();return {ok:true,id:result.insertId};
 }catch(error){await c.rollback();throw error;}finally{c.release();}
}
