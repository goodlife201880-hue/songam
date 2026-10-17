import React,{useEffect,useState} from 'react';
import {api} from './api';
import {costTotals} from './material-money.mjs';
import {foodMoney,compatibleUnits} from '../shared/food-cost.mjs';
const today=()=>new Date().toISOString().slice(0,10);
const blank=()=>({category_id:'',goods_id:'',unit:'',quantity:'',total_cost:'',currency:''});
export default function GoodsImport(){
 const [catalog,setCatalog]=useState({categories:[],goods:[]});
 const [imports,setImports]=useState([]),[form,setForm]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){setLoading(true);try{const [history,items]=await Promise.all([api('/imports/goods'),api('/imports/goods-catalog')]);setImports(history.imports);setCatalog(items);}catch(e){setError(e.message);}finally{setLoading(false);}}
 useEffect(()=>{load();},[]);
 function update(index,key,value){setForm({...form,items:form.items.map((row,i)=>i!==index?row:key==='category_id'?{...row,category_id:value,goods_id:'',unit:'',currency:''}:key==='goods_id'?{...row,goods_id:value,unit:catalog.goods.find(g=>String(g.id)===String(value))?.unit||'',currency:catalog.goods.find(g=>String(g.id)===String(value))?.currency||''}:{...row,[key]:value})});}
 async function save(e){e.preventDefault();setBusy(true);setError('');try{await api('/imports/goods',{method:'POST',body:JSON.stringify(form)});setForm(null);setNotice('Goods import saved.');await load();}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <><div className="toolbar"><h2>Goods Import</h2><button className="primary" disabled={busy||loading||!catalog.goods.length} onClick={()=>{setForm({imported_on:today(),items:[blank()]});setError('');setNotice('');}}>New goods import</button></div>
 {error&&<p className="error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {!loading&&!catalog.goods.length&&<p>Add goods and categories in Goods management first.</p>}
 {form&&<form className="user-form" onSubmit={save}><fieldset className="food-fields" disabled={busy}><h3>New goods import</h3>
 <label>Import date<input required type="date" min="1000-01-01" max={today()} value={form.imported_on} onChange={e=>setForm({...form,imported_on:e.target.value})}/></label><p>Enter the total cost paid for each row’s quantity.</p>
 {form.items.map((row,index)=><div className="import-row" key={index}>
 <label>Goods category<select required value={row.category_id} onChange={e=>update(index,'category_id',e.target.value)}><option value="" disabled>Select goods type</option>{catalog.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label>Goods name<select required disabled={!row.category_id} value={row.goods_id} onChange={e=>update(index,'goods_id',e.target.value)}><option value="" disabled>Select goods</option>{catalog.goods.filter(g=>String(g.category_id)===String(row.category_id)).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
 <label>Unit<select required disabled={!row.goods_id} value={row.unit} onChange={e=>update(index,'unit',e.target.value)}><option value="" disabled>Select unit</option>{compatibleUnits(catalog.goods.find(g=>String(g.id)===String(row.goods_id))?.unit).map(unit=><option key={unit}>{unit}</option>)}</select></label>
 <label>Quantity<input type="number" min="0.001" max="99999999.999" step="0.001" required value={row.quantity} onChange={e=>update(index,'quantity',e.target.value)}/></label>
 <label>Total cost<input type="number" min="0" max="99999999.999" step="0.001" required value={row.total_cost} onChange={e=>update(index,'total_cost',e.target.value)}/></label>
 <label>Currency<select required value={row.currency} onChange={e=>update(index,'currency',e.target.value)}><option value="" disabled>Select currency</option><option value="USD">Dollar ($)</option><option value="KRW">Won (₩)</option></select></label>
 <button type="button" disabled={form.items.length===1} aria-label={'Remove goods row '+(index+1)} onClick={()=>setForm({...form,items:form.items.filter((_,i)=>i!==index)})}>Remove</button>
 </div>)}
 <div className="actions form-buttons"><button type="button" disabled={form.items.length>=50} onClick={()=>setForm({...form,items:[...form.items,blank()]})}>Add goods</button></div>
 <p aria-live="polite">Import total: <strong>{form.items.every(row=>row.currency&&row.total_cost!=='')?costTotals(form.items):'Enter costs and currencies.'}</strong></p>
 <div className="actions form-buttons"><button className="primary">{busy?'Saving…':'Save goods import'}</button><button type="button" onClick={()=>setForm(null)}>Cancel</button></div>
 </fieldset></form>}
 <h3>Import history</h3><p>Latest 100 goods imports.</p>{loading?<p role="status">Loading goods imports…</p>:!imports.length?<p>No goods imports recorded yet.</p>:null}
 {imports.map(batch=><details className="import-history" key={batch.id}><summary>{batch.imported_on} · Import #{batch.id} · {batch.items.length} goods · {costTotals(batch.items)}</summary><div className="table-scroll"><table><thead><tr><th>Goods name</th><th>Category</th><th>Quantity</th><th>Total cost</th></tr></thead><tbody>{batch.items.map(row=><tr key={row.id}><td>{row.name}</td><td>{row.category_name || '—'}</td><td>{row.quantity} {row.unit}</td><td>{foodMoney(row.total_cost,row.currency)}</td></tr>)}</tbody></table></div></details>)}
 </>;
}
