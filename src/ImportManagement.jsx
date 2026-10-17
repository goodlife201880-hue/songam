import GoodsImport from './GoodsImport';
import React,{useEffect,useState} from 'react';
import {api} from './api';
import {compatibleUnits,foodMoney} from '../shared/food-cost.mjs';
import {costTotals} from './material-money.mjs';
const today=()=>new Date().toISOString().slice(0,10);
const blank=()=>({category_id:'',material_id:'',quantity:'',unit:'',total_cost:'',currency:''});
export default function ImportManagement(){
 const [page,setPage]=useState('materials'),[catalog,setCatalog]=useState({categories:[],materials:[]}),[imports,setImports]=useState([]),[form,setForm]=useState(null);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){setLoading(true);try{const [data,history]=await Promise.all([api('/imports/catalog'),api('/imports/materials')]);setCatalog(data);setImports(history.imports);}catch(e){setError(e.message);}finally{setLoading(false);}}
 useEffect(()=>{load();},[]);
 function update(index,key,value){setForm(current=>({...current,items:current.items.map((row,i)=>{
  if(i!==index)return row;
  if(key==='category_id')return {...row,category_id:value,material_id:'',unit:'',currency:''};
  if(key==='material_id'){const m=catalog.materials.find(m=>String(m.id)===String(value));return {...row,material_id:value,unit:m?.unit||'',currency:m?.currency||''};}
  return {...row,[key]:value};
 })}));}
 async function save(e){e.preventDefault();setBusy(true);setError('');try{
  await api('/imports/materials',{method:'POST',body:JSON.stringify({imported_on:form.imported_on,items:form.items.map(({category_id,...row})=>row)})});
  setForm(null);setNotice('Material import saved.');await load();
 }catch(e){setError(e.message);}finally{setBusy(false);}}
 return <section className="content-card"><div className="card-top user-tabs">{[['materials','Material Import'],['goods','Goods Import']].map(([id,label])=><button key={id} disabled={busy} aria-pressed={page===id} data-state={page===id?'active':'inactive'} onClick={()=>setPage(id)}>{label}</button>)}</div><div className="users-body">
 {page==='goods'?<GoodsImport/>:<>
 <div className="toolbar"><h2>Material Import</h2><button className="primary" disabled={loading||busy||!catalog.materials.length} onClick={()=>{setForm({imported_on:today(),items:[blank()]});setError('');setNotice('');}}>New import</button></div>
 {error&&<p className="error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {form&&<form className="user-form" onSubmit={save}><fieldset className="food-fields" disabled={busy}><h3>New material import</h3>
 <label>Import date<input type="date" required min="1000-01-01" max={today()} value={form.imported_on} onChange={e=>setForm({...form,imported_on:e.target.value})}/></label>
 <p>Enter the total cost paid for each row’s weight or quantity.</p>
 {form.items.map((row,index)=>{const material=catalog.materials.find(m=>String(m.id)===String(row.material_id));return <div className="import-row" key={index}>
 <label>Category<select required value={row.category_id} onChange={e=>update(index,'category_id',e.target.value)}><option value="" disabled>Select material type</option>{catalog.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label>Material name<select required disabled={!row.category_id} value={row.material_id} onChange={e=>update(index,'material_id',e.target.value)}><option value="" disabled>Select material</option>{catalog.materials.filter(m=>String(m.category_id)===String(row.category_id)).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
 <label>Weight / quantity<input type="number" min="0.001" max="99999999.999" step="0.001" required value={row.quantity} onChange={e=>update(index,'quantity',e.target.value)}/></label>
 <label>Unit<select required disabled={!material} value={row.unit} onChange={e=>update(index,'unit',e.target.value)}><option value="" disabled>Select unit</option>{compatibleUnits(material?.unit).map(unit=><option key={unit}>{unit}</option>)}</select></label>
 <label>Total cost<input type="number" min="0" max="99999999.999" step="0.001" required value={row.total_cost} onChange={e=>update(index,'total_cost',e.target.value)}/></label>
 <label>Currency<select required value={row.currency} onChange={e=>update(index,'currency',e.target.value)}><option value="" disabled>Select currency</option><option value="USD">Dollar ($)</option><option value="KRW">Won (₩)</option></select></label>
 <button type="button" disabled={form.items.length===1} aria-label={'Remove material '+(index+1)} onClick={()=>setForm({...form,items:form.items.filter((_,i)=>i!==index)})}>Remove</button>
 </div>;})}
 <div className="actions form-buttons"><button type="button" disabled={form.items.length>=50} onClick={()=>setForm({...form,items:[...form.items,blank()]})}>Add material</button></div>
 <p aria-live="polite">Import total: <strong>{form.items.every(row=>row.currency&&row.total_cost!=='')?costTotals(form.items):'Enter costs and currencies.'}</strong></p>
 <div className="actions form-buttons"><button className="primary">{busy?'Saving…':'Save import'}</button><button type="button" onClick={()=>setForm(null)}>Cancel</button></div>
 </fieldset></form>}
 {loading?<p role="status">Loading imports…</p>:!catalog.materials.length?<p>Add materials in Material management first.</p>:null}
 <h3>Import history</h3><p>Latest 100 imports.</p>
 {!loading&&!imports.length&&<p>No material imports recorded yet.</p>}
 {imports.map(batch=><details className="import-history" key={batch.id}><summary>{batch.imported_on} · Import #{batch.id} · {batch.items.length} materials · {costTotals(batch.items)}</summary><div className="table-scroll"><table><thead><tr><th>Material name</th><th>Weight / quantity</th><th>Total cost</th></tr></thead><tbody>{batch.items.map(row=><tr key={row.id}><td>{row.material_name}</td><td>{row.quantity} {row.unit}</td><td>{foodMoney(row.total_cost,row.currency)}</td></tr>)}</tbody></table></div></details>)}
 </>}
 </div></section>;
}
