import {pool} from './db.mjs';
import {bad,name,id,decimal,currency} from './material-domain.mjs';
import {recipeCost} from '../shared/food-cost.mjs';

export async function initializeFoods(){
 await pool.query(`CREATE TABLE IF NOT EXISTS foods (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  serving_price DECIMAL(11,3) NOT NULL,
  currency ENUM('USD','KRW') NOT NULL
 ) ENGINE=InnoDB`);
 await pool.query(`CREATE TABLE IF NOT EXISTS food_ingredients (
  food_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  quantity DECIMAL(11,3) NOT NULL,
  unit VARCHAR(12) NOT NULL,
  PRIMARY KEY(food_id,material_id),
  FOREIGN KEY(food_id) REFERENCES foods(id) ON DELETE CASCADE,
  FOREIGN KEY(material_id) REFERENCES materials(id) ON DELETE RESTRICT
 ) ENGINE=InnoDB`);
}

export async function foodRoute(req,user,body){
 const path=new URL(req.url,'http://localhost').pathname,method=req.method;
 const catalog=path==='/api/food/catalog'&&method==='GET';
 const match=path.match(/^\/api\/food\/items(?:\/(\d+))?$/);
 const recordId=match?.[1]?id(match[1]):null;
 if(!catalog&&(!match||!((method==='POST'&&!recordId)||(['PUT','DELETE'].includes(method)&&recordId))))bad('Not found.',404);
 const data=catalog||method==='DELETE'?{}:await body(req);
 const c=await pool.getConnection();
 try{
  await c.beginTransaction();
  if(catalog){
   const [materials]=await c.query('SELECT id,name,category_id,unit,unit_cost,currency FROM materials ORDER BY name');
   const [categories]=await c.query('SELECT id,name FROM material_categories ORDER BY name');
   const [foods]=await c.query('SELECT * FROM foods ORDER BY name');
   const [ingredients]=await c.query('SELECT * FROM food_ingredients ORDER BY food_id,material_id');
   const grouped=new Map();
   for(const row of ingredients){if(!grouped.has(row.food_id))grouped.set(row.food_id,[]);grouped.get(row.food_id).push(row);}
   const result={categories,materials,foods:foods.map(food=>({...food,...recipeCost(grouped.get(food.id)||[],materials)}))};
   await c.commit();return result;
  }
  // Keep recipe edits and material price/unit edits consistent.
  await c.query('SELECT id FROM management_lock WHERE id=1 FOR UPDATE');
  if(recordId){const [rows]=await c.execute('SELECT id FROM foods WHERE id=?',[recordId]);if(!rows.length)bad('Food not found.',404);}
  if(method==='DELETE')await c.execute('DELETE FROM foods WHERE id=?',[recordId]);
  else{
   if(!data||typeof data!=='object'||Array.isArray(data))bad('Enter the food details and ingredients.');
   const foodName=name(data.name),price=decimal(data.serving_price),priceCurrency=currency(data.currency);
   const [materials]=await c.query('SELECT id,name,category_id,unit,unit_cost,currency FROM materials');
   const recipe=recipeCost(data.ingredients,materials);
   let foodId=recordId;
   if(method==='POST'){const [result]=await c.execute('INSERT INTO foods (name,serving_price,currency) VALUES (?,?,?)',[foodName,price,priceCurrency]);foodId=result.insertId;}
   else{
    await c.execute('UPDATE foods SET name=?,serving_price=?,currency=? WHERE id=?',[foodName,price,priceCurrency,foodId]);
    await c.execute('DELETE FROM food_ingredients WHERE food_id=?',[foodId]);
   }
   for(const row of recipe.ingredients)await c.execute('INSERT INTO food_ingredients (food_id,material_id,quantity,unit) VALUES (?,?,?,?)',[foodId,row.material_id,row.quantity,row.unit]);
  }
  await c.commit();return {ok:true};
 }catch(error){await c.rollback();if(error.code==='ER_DUP_ENTRY')bad('A food with that name already exists.',409);throw error;}
 finally{c.release();}
}
