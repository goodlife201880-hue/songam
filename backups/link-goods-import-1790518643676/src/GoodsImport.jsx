import React,{useEffect,useState} from 'react';
import {api} from './api';
import {costTotals} from './material-money.mjs';
import {foodMoney} from '../shared/food-cost.mjs';
const today=()=>new Date().toISOString().slice(0,10);
const blank=()=>({name:'',quantity:'',total_cost:'',currency:''});
export default function GoodsImport(){
 const [imports,setImports]=useState([]),[form,setForm]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){setLoading(true);try{setImports((await api('/imports/goods')).imports);}catch(e){setError(e.message);}finally{setLoading(false);}}
 useEffect(()=>{load();},[]);
 function update(index,key,value){setForm({...form,items:form.items.map((row,i)=>i===index?{...row,[key]:value}:row)});}
 async function save(e){e.preventDefault();setBusy(true);setError('');try{await api('/imports/goods',{method:'POST',body:JSON.stringify(form)});setForm(null);setNotice('Goods import saved.');await load();}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <><div className="toolbar"><h2>Goods Import</h2><button className="primary" disabled={busy||loading} onClick={()=>{setForm({imported_on:today(),items:[blank()]});setError('');setNotice('');}}>New goods import</button></div>
 {error&&<p className="error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {form&&<form className="user-form" onSubmit={save}><fieldset className="food-fields" disabled={busy}><h3>New goods import</h3>
 <label>Import date<input required type="date" min="1000-01-01" max={today()} value={form.imported_on} onChange={e=>setForm({...form,imported_on:e.target.value})}/></label><p>Enter the total cost paid for each row’s quantity.</p>
 {form.items.map((row,index)=><div className="import-row" key={index}>
 <label>Goods name<input required maxLength={120} value={row.name} onChange={e=>update(index,'name',e.target.value)}/></label>
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
 {imports.map(batch=><details className="import-history" key={batch.id}><summary>{batch.imported_on} · Import #{batch.id} · {batch.items.length} goods · {costTotals(batch.items)}</summary><div className="table-scroll"><table><thead><tr><th>Goods name</th><th>Quantity</th><th>Total cost</th></tr></thead><tbody>{batch.items.map(row=><tr key={row.id}><td>{row.name}</td><td>{row.quantity}</td><td>{foodMoney(row.total_cost,row.currency)}</td></tr>)}</tbody></table></div></details>)}
 </>;
}
