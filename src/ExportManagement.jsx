import React,{useEffect,useState} from 'react';
import {api} from './api';
import {exportPrice,exportTotals} from '../shared/export-price.mjs';
import {compatibleUnits,foodMoney} from '../shared/food-cost.mjs';
const today=()=>new Date().toISOString().slice(0,10);
const blank=type=>({type,category_id:'',item_id:'',quantity:'',unit:''});
const totalsText=rows=>exportTotals(rows).map(row=>foodMoney(row.total_price,row.currency)).join(' + ');
export default function ExportManagement(){
 const [page,setPage]=useState('food'),[busy,setBusy]=useState(false);
 return <section className="content-card"><div className="card-top user-tabs">{[['food','Food export'],['goods','Goods export']].map(([type,label])=><button key={type} disabled={busy} aria-pressed={page===type} data-state={page===type?'active':'inactive'} onClick={()=>setPage(type)}>{label}</button>)}</div><ExportPage key={page} type={page} onBusyChange={setBusy}/></section>;
}
function ExportPage({type,onBusyChange}){
 const [catalog,setCatalog]=useState({foods:[],goods:[],categories:[]}),[exports,setExports]=useState([]),[form,setForm]=useState(null);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){setLoading(true);try{const [data,history]=await Promise.all([api('/exports/catalog?type='+type),api('/exports/sales?type='+type)]);setCatalog(data);setExports(history.exports);}catch(e){setError(e.message);}finally{setLoading(false);}}
 useEffect(()=>{load();},[]);
 useEffect(()=>{onBusyChange(busy);},[busy,onBusyChange]);
 function update(index,key,value){setForm(current=>({...current,items:current.items.map((row,i)=>{
  if(i!==index)return row;
  if(key==='category_id')return {...row,category_id:value,item_id:'',unit:''};
  if(key==='item_id'){const selected=(row.type==='food'?catalog.foods:catalog.goods).find(item=>String(item.id)===String(value));return {...row,item_id:value,unit:row.type==='food'?'serving':selected?.unit||''};}
  return {...row,[key]:value};
 })}));}
 async function save(e){e.preventDefault();setBusy(true);setError('');try{await api('/exports/sales?type='+type,{method:'POST',body:JSON.stringify(form)});setForm(null);setNotice('Export saved.');await load();}catch(e){setError(e.message);}finally{setBusy(false);}}
 const calculated=form?.items.map(row=>{try{return {line:exportPrice(row,catalog.foods,catalog.goods)};}catch(e){return {error:e.message};}});
 const complete=calculated?.every(row=>row.line);
 return <div className="users-body">
 <div className="toolbar"><h2>{type==='food'?'Food export':'Goods export'}</h2><button className="primary" disabled={busy||loading||!(type==='food'?catalog.foods:catalog.goods).length} onClick={()=>{setForm({exported_on:today(),items:[blank(type)]});setError('');setNotice('');}}>New export</button></div>
 <p>{type==='food'?'Select foods and quantities. Totals use the saved serving prices.':'Select goods and quantities. Totals use the saved goods cost as the price.'}</p>
 {error&&<p className="error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {form&&<form className="user-form" onSubmit={save}><fieldset className="food-fields" disabled={busy}><h3>New export</h3>
 <label>Export date<input type="date" required min="1000-01-01" max={today()} value={form.exported_on} onChange={e=>setForm({...form,exported_on:e.target.value})}/></label>
 {form.items.map((row,index)=>{
 const options=row.type==='food'?catalog.foods:catalog.goods.filter(item=>String(item.category_id)===String(row.category_id));
 const selected=options.find(item=>String(item.id)===String(row.item_id)),line=calculated[index].line;
 return <div className="import-row" key={index}>
 {row.type==='goods'&&<label>Goods category<select required value={row.category_id} onChange={e=>update(index,'category_id',e.target.value)}><option value="" disabled>Select goods type</option>{catalog.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
 <label>{row.type==='food'?'Food':'Goods'} name<select required disabled={!row.type||(row.type==='goods'&&!row.category_id)} value={row.item_id} onChange={e=>update(index,'item_id',e.target.value)}><option value="" disabled>Select item</option>{options.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
 <label>Quantity<input type="number" required min={row.type==='food'?'1':'0.001'} step={row.type==='food'?'1':'0.001'} max="99999999.999" value={row.quantity} onChange={e=>update(index,'quantity',e.target.value)}/></label>
 <label>Unit<select required disabled={!selected||row.type==='food'} value={row.unit} onChange={e=>update(index,'unit',e.target.value)}><option value="" disabled>Select unit</option>{(row.type==='food'?['serving']:compatibleUnits(selected?.unit)).map(unit=><option key={unit}>{unit}</option>)}</select></label>
 <label>Price per unit<input readOnly value={selected&&(row.type==='food'?selected.serving_price:selected.unit_cost)!=null?foodMoney(row.type==='food'?selected.serving_price:selected.unit_cost,selected.currency)+' / '+(row.type==='food'?'serving':selected.unit):''} placeholder="Select an item with a price"/></label>
 <label>Total price<input readOnly value={line?foodMoney(line.total_price,line.currency):''} placeholder="Calculated automatically"/></label>
 {row.item_id&&calculated[index].error&&<p className="wide">{calculated[index].error}</p>}
 <button type="button" disabled={form.items.length===1} aria-label={'Remove item '+(index+1)} onClick={()=>setForm({...form,items:form.items.filter((_,i)=>i!==index)})}>Remove</button>
 </div>;
 })}
 <div className="actions form-buttons"><button type="button" disabled={form.items.length>=50} onClick={()=>setForm({...form,items:[...form.items,blank(type)]})}>{type==='food'?'Add food':'Add goods'}</button></div>
 <div className="recipe-total" aria-live="polite"><span>Total selling price</span><strong>{complete?totalsText(calculated.map(row=>row.line)):'Choose items and enter quantities.'}</strong><small>USD and KRW are totaled separately. Prices are saved at the time of export.</small></div>
 <div className="actions form-buttons"><button className="primary" disabled={!complete}>{busy?'Saving…':'Save export'}</button><button type="button" onClick={()=>setForm(null)}>Cancel</button></div>
 </fieldset></form>}
 <h3>Export history</h3><p>Latest 100 exports.</p>{loading?<p role="status">Loading exports…</p>:!exports.length?<p>No exports recorded yet.</p>:null}
 {exports.map(sale=><details className="import-history" key={sale.id}><summary>{sale.exported_on} · Export #{sale.id} · {sale.items.length} items · {totalsText(sale.items)}</summary><div className="table-scroll"><table><thead><tr><th>Type</th><th>Name</th><th>Quantity</th><th>Price per unit</th><th>Total price</th></tr></thead><tbody>{sale.items.map(row=><tr key={row.id}><td>{row.item_type==='food'?'Food':'Goods'}</td><td>{row.name}</td><td>{row.quantity} {row.unit}</td><td>{foodMoney(row.unit_price,row.currency)} / {row.price_unit}</td><td>{foodMoney(row.total_price,row.currency)}</td></tr>)}</tbody></table></div></details>)}
 </div>;
}
