import React,{useEffect,useState} from 'react';
import {api} from './api';
import {compatibleUnits,recipeCost,foodMoney,foodCostText} from '../shared/food-cost.mjs';

const blankIngredient=()=>({material_id:'',quantity:'',unit:''});
export default function FoodManagement(){
 const [catalog,setCatalog]=useState({foods:[],materials:[]}),[form,setForm]=useState(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){setLoading(true);try{setCatalog(await api('/food/catalog'));}catch(e){setError(e.message);}finally{setLoading(false);}}
 useEffect(()=>{load();},[]);
 function create(){setError('');setNotice('');setForm({name:'',serving_price:'',currency:'',ingredients:[blankIngredient()]});}
 function edit(food){setError('');setNotice('');setForm({...food,ingredients:food.ingredients.map(row=>({material_id:row.material_id,quantity:row.quantity,unit:row.unit}))});}
 function ingredient(index,key,value){setForm(current=>({...current,ingredients:current.ingredients.map((row,i)=>{
  if(i!==index)return row;
  if(key==='material_id'){const material=catalog.materials.find(m=>String(m.id)===String(value));return {...row,material_id:value,unit:material?.unit||''};}
  return {...row,[key]:value};
 })}));}
 async function save(event){event.preventDefault();setError('');setBusy(true);try{
  recipeCost(form.ingredients,catalog.materials);
  await api('/food/items'+(form.id?'/'+form.id:''),{method:form.id?'PUT':'POST',body:JSON.stringify({name:form.name,serving_price:form.serving_price,currency:form.currency,ingredients:form.ingredients})});
  setForm(null);setNotice('Food saved successfully.');await load();
 }catch(e){setError(e.message);}finally{setBusy(false);}}
 async function remove(food){if(!window.confirm('Delete '+food.name+' and its recipe?'))return;setError('');setBusy(true);try{
  await api('/food/items/'+food.id,{method:'DELETE',body:'{}'});if(form?.id===food.id)setForm(null);setNotice('Food deleted.');await load();
 }catch(e){setError(e.message);}finally{setBusy(false);}}
 let preview=null,previewError='';
 if(form){try{preview=recipeCost(form.ingredients,catalog.materials);}catch(e){previewError=e.message;}}
 return <section className="content-card"><div className="users-body">
  <div className="toolbar"><h2>Food list</h2><button className="primary" disabled={busy||loading||!catalog.materials.length} onClick={create}>Add food</button></div>
  <p>Recipes and ingredient costs are for one serving. Costs use current material prices; the serving price is what you charge.</p>
  {error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {form&&<form className="user-form" onSubmit={save}><fieldset className="food-fields" disabled={busy}>
   <h3>{form.id?'Edit food':'New food'}</h3>
   <div className="form-grid">
    <label>Food name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required maxLength={120}/></label>
    <label>Serving price currency<select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} required><option value="" disabled>Select currency</option><option value="USD">Dollar ($)</option><option value="KRW">Won (₩)</option></select></label>
    <label>Serving price<input type="number" min="0" max="99999999.999" step="0.001" value={form.serving_price} onChange={e=>setForm({...form,serving_price:e.target.value})} required/></label>
   </div>
   <h3>Ingredients per serving</h3>
   {form.ingredients.map((row,index)=>{
    const material=catalog.materials.find(m=>String(m.id)===String(row.material_id));
    let line=null;try{line=recipeCost([row],catalog.materials).ingredients[0];}catch{}
    return <div className="recipe-row" key={index}>
     <label>Material {index+1}<select value={row.material_id} onChange={e=>ingredient(index,'material_id',e.target.value)} required><option value="" disabled>Select material</option>{catalog.materials.map(m=><option key={m.id} value={m.id} disabled={form.ingredients.some((other,i)=>i!==index&&String(other.material_id)===String(m.id))}>{m.name}</option>)}</select></label>
     <label>Quantity<input type="number" min="0.001" max="99999999.999" step="0.001" value={row.quantity} onChange={e=>ingredient(index,'quantity',e.target.value)} required/></label>
     <label>Unit<select value={row.unit} onChange={e=>ingredient(index,'unit',e.target.value)} required disabled={!material}><option value="" disabled>Select unit</option>{compatibleUnits(material?.unit).map(unit=><option key={unit} value={unit}>{unit}</option>)}</select></label>
     <div className="recipe-line-cost">{material&&<small>{foodMoney(material.unit_cost,material.currency)} / {material.unit}</small>}<strong>{line?foodMoney(line.cost,line.currency):'—'}</strong></div>
     <button type="button" aria-label={'Remove ingredient '+(index+1)} disabled={form.ingredients.length===1} onClick={()=>setForm({...form,ingredients:form.ingredients.filter((_,i)=>i!==index)})}>Remove</button>
    </div>;
   })}
   <div className="actions form-buttons"><button type="button" disabled={form.ingredients.length>=100||form.ingredients.length>=catalog.materials.length} onClick={()=>setForm({...form,ingredients:[...form.ingredients,blankIngredient()]})}>Add ingredient</button></div>
   <div className="recipe-total" aria-live="polite"><span>Ingredient cost per serving</span><strong>{preview?foodCostText(preview.costs):'Complete the recipe to calculate its cost.'}</strong>{preview?.costs.length>1&&<small>USD and KRW are shown separately. No currency conversion is applied.</small>}{!preview&&<small>{previewError}</small>}</div>
   <div className="actions form-buttons"><button className="primary" disabled={!preview}>{busy?'Saving…':'Save food'}</button><button type="button" onClick={()=>setForm(null)}>Cancel</button></div>
  </fieldset></form>}
  {loading?<p role="status">Loading foods…</p>:!catalog.foods.length?<p>{catalog.materials.length?'No foods yet. Add a food and its ingredients.':'Add materials in Material management before creating a food.'}</p>:<div className="table-scroll"><table><thead><tr><th>Food</th><th>Recipe per serving</th><th>Ingredient cost</th><th>Serving price</th><th>Actions</th></tr></thead><tbody>{catalog.foods.map(food=><tr key={food.id}>
   <td>{food.name}</td><td><details><summary>{food.ingredients.length} ingredient{food.ingredients.length===1?'':'s'}</summary><ul className="recipe-details">{food.ingredients.map(row=><li key={row.material_id}>{row.quantity} {row.unit} {row.name} — {foodMoney(row.cost,row.currency)}</li>)}</ul></details></td>
   <td>{foodCostText(food.costs)}</td><td>{foodMoney(food.serving_price,food.currency)}</td><td><div className="actions"><button disabled={busy} onClick={()=>edit(food)}>Edit</button><button disabled={busy} onClick={()=>remove(food)}>Delete</button></div></td>
  </tr>)}</tbody></table></div>}
 </div></section>;
}
