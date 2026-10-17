import {goodsImportCost} from '../shared/goods-import-cost.mjs';
import React,{useEffect,useState} from 'react';
import {api} from './api';
import {compatibleUnits,foodMoney} from '../shared/food-cost.mjs';
import {costTotals} from './material-money.mjs';
const today=()=>new Date().toISOString().slice(0,10);
const blank=()=>({category_id:'',goods_id:'',quantity:'',unit:''});
export default function GoodsImport(){
 const [catalog,setCatalog]=useState({categories:[],goods:[]}),[imports,setImports]=useState([]),[form,setForm]=useState(null);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){setLoading(true);try{const [data,history]=await Promise.all([api('/imports/goods-catalog'),api('/imports/goods')]);setCatalog(data);setImports(history.imports);}catch(e){setError(e.message);}finally{setLoading(false);}}
 useEffect(()=>{load();},[]);
 function update(index,key,value){setForm(current=>({...current,items:current.items.map((row,i)=>{
  if(i!==index)return row;
  if(key==='category_id')return {...row,category_id:value,goods_id:'',unit:''};
  if(key==='goods_id'){const m=catalog.goods.find(m=>String(m.id)===String(value));return {...row,goods_id:value,unit:m?.unit||''};}
  return {...row,[key]:value};
 })}));}
 async function save(e){e.preventDefault();setBusy(true);setError('');try{
  await api('/imports/goods',{method:'POST',body:JSON.stringify({imported_on:form.imported_on,items:form.items})});
  setForm(null);setNotice('Goods import saved.');await load();
 }catch(e){setError(e.message);}finally{setBusy(false);}}
 const calculated=form?.items.map(row=>{try{return goodsImportCost(row,catalog.goods.find(g=>String(g.id)===String(row.goods_id)));}catch{return null;}});
 return <>
 <div className="toolbar"><h2>Goods Import</h2><button className="primary" disabled={loading||busy||!catalog.goods.length} onClick={()=>{setForm({imported_on:today(),items:[blank()]});setError('');setNotice('');}}>New import</button></div>
 {error&&<p className="error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {form&&<form className="user-form" onSubmit={save}><fieldset className="food-fields" disabled={busy}><h3>New goods import</h3>
 <label>Import date<input type="date" required min="1000-01-01" max={today()} value={form.imported_on} onChange={e=>setForm({...form,imported_on:e.target.value})}/></label>
 <p>Total cost is calculated from quantity and the saved goods cost, with unit conversion where needed. Totals use the goods currency and are rounded to 3 decimal places.</p>
 {form.items.map((row,index)=>{const goods=catalog.goods.find(m=>String(m.id)===String(row.goods_id));return <div className="import-row" key={index}>
 <label>Category<select required value={row.category_id} onChange={e=>update(index,'category_id',e.target.value)}><option value="" disabled>Select goods type</option>{catalog.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label>Goods name<select required disabled={!row.category_id} value={row.goods_id} onChange={e=>update(index,'goods_id',e.target.value)}><option value="" disabled>Select goods</option>{catalog.goods.filter(m=>String(m.category_id)===String(row.category_id)).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
 <label>Weight / quantity<input type="number" min="0.001" max="99999999.999" step="0.001" required value={row.quantity} onChange={e=>update(index,'quantity',e.target.value)}/></label>
 <label>Unit<select required disabled={!goods} value={row.unit} onChange={e=>update(index,'unit',e.target.value)}><option value="" disabled>Select unit</option>{compatibleUnits(goods?.unit).map(unit=><option key={unit}>{unit}</option>)}</select></label>
 <label>Total cost<input readOnly value={calculated[index]?foodMoney(calculated[index].total_cost,calculated[index].currency):''} placeholder="Calculated automatically"/></label>
 <label>Cost per unit<input readOnly value={goods?foodMoney(goods.unit_cost,goods.currency)+' / '+goods.unit:''} placeholder="Select goods"/></label>
 <button type="button" disabled={form.items.length===1} aria-label={'Remove goods '+(index+1)} onClick={()=>setForm({...form,items:form.items.filter((_,i)=>i!==index)})}>Remove</button>
 </div>;})}
 <div className="actions form-buttons"><button type="button" disabled={form.items.length>=50} onClick={()=>setForm({...form,items:[...form.items,blank()]})}>Add goods</button></div>
 <p aria-live="polite">Import total: <strong>{calculated.every(Boolean)?costTotals(calculated):'Select goods and enter valid quantities.'}</strong></p>
 <div className="actions form-buttons"><button className="primary" disabled={!calculated.every(Boolean)}>{busy?'Saving…':'Save import'}</button><button type="button" onClick={()=>setForm(null)}>Cancel</button></div>
 </fieldset></form>}
 {loading?<p role="status">Loading imports…</p>:!catalog.goods.length?<p>Add goods in Goods management first.</p>:null}
 <h3>Import history</h3><p>Latest 100 imports.</p>
 {!loading&&!imports.length&&<p>No goods imports recorded yet.</p>}
 {imports.map(batch=><details className="import-history" key={batch.id}><summary>{batch.imported_on} · Import #{batch.id} · {batch.items.length} goods · {costTotals(batch.items)}</summary><div className="table-scroll"><table><thead><tr><th>Goods name</th><th>Weight / quantity</th><th>Total cost</th></tr></thead><tbody>{batch.items.map(row=><tr key={row.id}><td>{row.name}</td><td>{row.quantity} {row.unit}</td><td>{foodMoney(row.total_cost,row.currency)}</td></tr>)}</tbody></table></div></details>)}
 </>;
}
