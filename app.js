const db=supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
let medicines=[];
let cart=JSON.parse(localStorage.getItem('aditya_cart')||'[]');
const $=id=>document.getElementById(id);
function money(n){return '₹'+Number(n||0).toLocaleString('en-IN')}
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function normalize(v){return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}

async function load(){
  const {data,error}=await db.from('medicines').select('id,name,category,price,stock,manufacturer,expiry_date').order('name');
  if(error){$('medicineGrid').innerHTML='<p class="error">Unable to load medicines. Please try again.</p>';console.error('Medicine load error:',error);return}
  medicines=data||[];
  renderCategories();
  renderMedicines('All');
  renderCart();
}

function renderCategories(){
  const cats=['All',...new Set(medicines.map(m=>m.category||'Other'))];
  $('categoryList').innerHTML=cats.map((c,i)=>`<button type="button" class="cat${i===0?' active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  document.querySelectorAll('.cat').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('.cat').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    renderMedicines(b.dataset.cat);
  });
}

function renderMedicines(cat='All'){
  const q=normalize($('search').value);
  const list=medicines.filter(m=>{
    const category=m.category||'Other';
    if(cat!=='All'&&category!==cat)return false;
    if(!q)return true;
    const searchable=normalize(`${m.name||''} ${category} ${m.manufacturer||''}`);
    return searchable.includes(q);
  });
  $('medicineGrid').innerHTML=list.length?list.map(m=>`<article class="medicine"><div class="pill">💊</div><small>${esc(m.category||'Other')}</small><h3>${esc(m.name)}</h3><p>${esc(m.manufacturer||'Genuine medicine')}</p><div class="med-bottom"><strong>${m.price?money(m.price):'Check price'}</strong><button type="button" ${Number(m.stock||0)<=0?'disabled':''} onclick="add('${m.id}')">${Number(m.stock||0)<=0?'Out of Stock':'Add'}</button></div></article>`).join(''):'<p>No medicine found.</p>';
}

function add(id){
  const m=medicines.find(x=>String(x.id)===String(id));
  if(!m||Number(m.stock||0)<=0)return;
  const x=cart.find(x=>String(x.id)===String(id));
  if(x){if(x.qty>=Number(m.stock))return alert('Only '+m.stock+' unit(s) available.');x.qty++}
  else cart.push({id,qty:1});
  saveCart();renderCart();openCart();
}
function saveCart(){localStorage.setItem('aditya_cart',JSON.stringify(cart))}
function total(){return cart.reduce((s,x)=>{const m=medicines.find(m=>String(m.id)===String(x.id));return s+(Number(m?.price)||0)*x.qty},0)}
function renderCart(){
  $('cartCount').textContent=cart.reduce((s,x)=>s+x.qty,0);
  $('cartTotal').textContent=money(total());
  $('cartItems').innerHTML=cart.length?cart.map(x=>{const m=medicines.find(m=>String(m.id)===String(x.id));return `<div class="cart-row"><div><b>${esc(m?.name||'Medicine')}</b><small>${money(m?.price)} each</small></div><div class="qty"><button type="button" onclick="qty('${x.id}',-1)">−</button>${x.qty}<button type="button" onclick="qty('${x.id}',1)">+</button></div></div>`}).join(''):'<p>Your cart is empty.</p>';
}
function qty(id,d){
  const x=cart.find(x=>String(x.id)===String(id)),m=medicines.find(m=>String(m.id)===String(id));
  if(!x)return;
  x.qty+=d;
  if(d>0&&x.qty>Number(m?.stock||0))x.qty=Number(m.stock);
  if(x.qty<=0)cart=cart.filter(y=>String(y.id)!==String(id));
  saveCart();renderCart();
}
function openCart(){$('cart').classList.add('open')}
function closeCart(){$('cart').classList.remove('open')}
function openOrder(){if(!cart.length)return alert('Please add a medicine first.');closeCart();$('order').classList.add('open');$('orderTotal').textContent=money(total())}
function closeOrder(){$('order').classList.remove('open')}

async function placeOrder(e){
  e.preventDefault();
  const name=$('name').value.trim(),phone=$('phone').value.trim(),address=$('address').value.trim(),paymentMethod=$('paymentMethod').value;
  if(!/^[0-9]{10}$/.test(phone))return alert('Enter a valid 10-digit mobile number.');
  const items=cart.map(x=>{const m=medicines.find(m=>String(m.id)===String(x.id));return{name:m.name,pack:'Available stock: '+m.stock,qty:x.qty,price:Number(m.price)||0,medicine_id:m.id}});
  const orderId='AMS-'+Date.now().toString().slice(-8),amount=total();
  try{
    const reservations=[];
    for(const x of cart){
      const {data,error}=await db.rpc('reserve_medicine_stock',{p_medicine_id:x.id,p_quantity:x.qty});
      if(error)throw error;
      if(!data?.length)throw new Error('Stock is no longer available for one of your medicines.');
      reservations.push({id:x.id,qty:x.qty});
    }
    const {error}=await db.from('orders').insert({order_id:orderId,customer_name:name,phone,address,payment_method:paymentMethod,transaction_id:null,items,total:amount,status:'Pending'});
    if(error){for(const r of reservations)await db.rpc('restore_medicine_stock',{p_medicine_id:r.id,p_quantity:r.qty});throw error}
    cart=[];saveCart();renderCart();closeOrder();
    if(paymentMethod==='UPI'&&window.AdityaUPI){window.AdityaUPI.pay(amount,orderId);return}
    finishOrder(orderId,amount,paymentMethod);
  }catch(err){alert(err.message||'Unable to place order.')}
}
function finishOrder(orderId,amount,paymentMethod){$('successText').innerHTML=`Order <b>${esc(orderId)}</b> submitted successfully.<br>Total: <b>${money(amount)}</b><br><small>Payment: ${esc(paymentMethod==='UPI'?'UPI':'Cash on Delivery')}</small>`;$('success').classList.add('open');load()}
function closeSuccess(){$('success').classList.remove('open')}
function maps(){window.open('https://www.google.com/maps/dir//Dr+Shubh+Lal+Ortho+Clinic,+28b,+Kasia+-+Gorakhpur+Rd,+Kushinagar,+Uttar+Pradesh+274402/@22.1313623,82.1169541,14z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3993eb6f9ba30815:0x74059df802c42d1!2m2!1d83.9025261!2d26.7474443','_blank')}

function initSearch(){
  const search=$('search');
  if(!search)return;
  const runSearch=()=>{
    const active=document.querySelector('.cat.active');
    renderMedicines(active?.dataset.cat||'All');
  };
  search.addEventListener('input',runSearch);
  search.addEventListener('search',runSearch);
  search.addEventListener('keyup',runSearch);
}

document.addEventListener('DOMContentLoaded',()=>{
  initSearch();
  load();
  $('cartBtn').onclick=openCart;
  $('closeCart').onclick=closeCart;
  $('checkout').onclick=openOrder;
  $('closeOrder').onclick=closeOrder;
  $('orderForm').onsubmit=placeOrder;
  $('closeSuccess').onclick=closeSuccess;
});