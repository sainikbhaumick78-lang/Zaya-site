/* ===== Data ===== */
const PRODUCTS = [
  { id:1, name:"Silk Blend Saree", price:2499, desc:"Lightweight, handcrafted border", category:"Saree", img:"" },
  { id:2, name:"Embroidered Blouse", price:799, desc:"Perfect match for Zaya sarees", category:"Blouse", img:"" },
  { id:3, name:"Summer Kurta Set", price:1299, desc:"Breathable cotton, modern fit", category:"Kurta", img:"" },
  { id:4, name:"Occasion Ready Dress", price:1799, desc:"Tailored silhouette for events", category:"Dress", img:"" }
];

/* ===== Helpers ===== */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const formatINR = n => "₹" + n.toLocaleString('en-IN');

/* ===== State & Elements ===== */
let catalog = [...PRODUCTS];
let cart = {}; // {id: {id, qty}}
const productGrid = $('#productGrid');
const cartList = $('#cartList');
const cartCount = $('#cartCount');
const cartSubtotal = $('#cartSubtotal');
const searchInput = $('#searchInput');
const filterCategory = $('#filterCategory');
const checkoutBtn = $('#checkoutBtn');
const clearCartBtn = $('#clearCart');
const previewModal = $('#previewModal');
const previewClose = $('#previewClose') || null;
const previewImg = $('#previewImg');
const previewTitle = $('#previewTitle');
const previewDesc = $('#previewDesc');
const previewPrice = $('#previewPrice');
const previewAdd = $('#previewAdd');
const previewOrder = $('#previewOrder');
const yearEl = $('#year');
if(yearEl) yearEl.textContent = new Date().getFullYear();

/* ===== Persistence ===== */
function saveCartToStorage(){
  try { localStorage.setItem('zaya_cart_v1', JSON.stringify(cart)); } catch(e){}
}
function loadCartFromStorage(){
  try {
    const raw = localStorage.getItem('zaya_cart_v1');
    if(raw) cart = JSON.parse(raw);
  } catch(e){}
}

/* ===== Cart helpers ===== */
function cartItems(){
  return Object.values(cart).map(item => {
    const prod = PRODUCTS.find(p => p.id === item.id);
    return { ...prod, qty: item.qty, line: prod.price * item.qty };
  });
}
function cartTotal(){
  return cartItems().reduce((s,i)=>s + i.line, 0);
}

/* ===== Renderers ===== */
function renderProducts(items){
  productGrid.innerHTML = '';
  if(items.length === 0){
    productGrid.innerHTML = '<div class="center small-muted">No products found</div>';
    return;
  }
  for(const p of items){
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <a href="#preview" class="preview-trigger" data-id="${p.id}" style="text-decoration:none;color:inherit">
        <div class="product-img">
          ${p.img ? `<img src="${p.img}" alt="${p.name}">` : `<div style="font-weight:900;color:var(--muted)">${p.name.split(' ')[0]}</div>`}
        </div>
        <div class="meta">
          <h3>${p.name}</h3>
          <p class="muted">${p.desc}</p>
        </div>
      </a>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="price">${formatINR(p.price)}</div>
        <div class="actions">
          <button class="btn btn-sm btn-accent add-btn" data-id="${p.id}">Add</button>
          <button class="btn btn-sm btn-ghost preview-btn" data-id="${p.id}">Preview</button>
        </div>
      </div>
    `;
    productGrid.appendChild(card);
  }
}

function renderCart(){
  cartList.innerHTML = '';
  const items = cartItems();
  if(items.length === 0){
    cartList.innerHTML = '<div class="small-muted">Cart is empty</div>';
    cartCount.textContent = '0';
    cartSubtotal.textContent = formatINR(0);
    return;
  }
  cartCount.textContent = items.reduce((s,i)=>s + i.qty, 0);
  cartSubtotal.textContent = formatINR(cartTotal());
  for(const it of items){
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-thumb">${it.name.split(' ')[0]}</div>
      <div class="cart-meta">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:800">${it.name}</div>
          <div style="font-weight:900">${formatINR(it.line)}</div>
        </div>
        <div class="qty" style="margin-top:6px">
          <button class="btn btn-ghost qty-decrease" data-id="${it.id}">-</button>
          <div style="min-width:28px;text-align:center">${it.qty}</div>
          <button class="btn btn-ghost qty-increase" data-id="${it.id}">+</button>
          <button class="btn btn-ghost" style="margin-left:8px" data-id="${it.id}" title="Remove">Remove</button>
        </div>
      </div>
    `;
    cartList.appendChild(row);
  }
}

/* ===== Cart operations ===== */
function addToCart(id, qty=1){
  const key = String(id);
  if(cart[key]) cart[key].qty += qty;
  else cart[key] = { id, qty };
  saveCartToStorage();
  renderCart();
}
function setQty(id, qty){
  const key = String(id);
  if(qty <= 0) delete cart[key];
  else cart[key].qty = qty;
  saveCartToStorage();
  renderCart();
}
function removeFromCart(id){
  const key = String(id); delete cart[key];
  saveCartToStorage(); renderCart();
}
function clearCart(){
  cart = {}; saveCartToStorage(); renderCart();
}

/* ===== UI: preview modal ===== */
let currentPreviewId = null;
function openPreview(id){
  const p = PRODUCTS.find(x=>x.id===id); if(!p) return;
  currentPreviewId = id;
  previewImg.innerHTML = p.img ? `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">` : `<div style="font-weight:900;color:var(--muted)">${p.name.split(' ')[0]}</div>`;
  previewTitle.textContent = p.name;
  previewDesc.textContent = p.desc;
  previewPrice.textContent = formatINR(p.price);
  previewOrder.setAttribute('href', `mailto:hello@zaya.example?subject=Order%20-%20${encodeURIComponent(p.name)}`);
  previewModal.classList.add('show');
}
function closePreview(){
  currentPreviewId = null;
  previewModal.classList.remove('show');
}

/* ===== attach events ===== */
function attachEvents(){
  // delegate add / preview / qty actions
  document.body.addEventListener('click', (e) => {
    const add = e.target.closest('.add-btn');
    if(add){
      const id = Number(add.getAttribute('data-id')); addToCart(id);
      return;
    }
    const previewBtn = e.target.closest('.preview-btn');
    if(previewBtn){
      const id = Number(previewBtn.getAttribute('data-id')); openPreview(id); return;
    }
    const previewTrigger = e.target.closest('.preview-trigger');
    if(previewTrigger){
      e.preventDefault();
      const id = Number(previewTrigger.getAttribute('data-id')); openPreview(id); return;
    }
    const dec = e.target.closest('.qty-decrease');
    if(dec){ const id = Number(dec.getAttribute('data-id')); const key=String(id); setQty(id, (cart[key]?.qty||1)-1); return; }
    const inc = e.target.closest('.qty-increase');
    if(inc){ const id = Number(inc.getAttribute('data-id')); const key=String(id); setQty(id, (cart[key]?.qty||0)+1); return; }
    const rem = e.target.closest('[title="Remove"]');
    if(rem){ const id = Number(rem.getAttribute('data-id')); removeFromCart(id); return; }
  });

  // preview modal controls
  const closeButtons = [ $('#previewClose') ].filter(Boolean);
  closeButtons.forEach(btn => btn.addEventListener('click', (ev)=> { ev.preventDefault(); closePreview(); }));

  if(previewAdd) previewAdd.addEventListener('click', ()=> {
    if(currentPreviewId) addToCart(currentPreviewId);
  });

  // search & filter
  searchInput.addEventListener('input', applySearchFilter);
  filterCategory.addEventListener('change', applySearchFilter);

  // checkout + clear
  checkoutBtn.addEventListener('click', ()=> {
    // simple mailto checkout with cart summary
    const items = cartItems();
    if(items.length === 0) { alert('Cart is empty'); return; }
    let body = 'Order from Zaya:%0D%0A%0D%0A';
    items.forEach(it => body += `${it.name} x${it.qty} - ${formatINR(it.line)}%0D%0A`);
    body += `%0D%0ASubtotal: ${formatINR(cartTotal())}%0D%0A%0D%0APlease reply with payment and shipping options.`;
    window.location.href = `mailto:hello@zaya.example?subject=Order%20from%20Website&body=${encodeURIComponent(body)}`;
  });
  clearCartBtn.addEventListener('click', ()=> { if(confirm('Clear cart?')) clearCart(); });

  // cart button: simple focus behaviour
  $('#cartBtn').addEventListener('click', ()=> { alert('Cart is in the right column — scroll to view or use the Checkout button.'); });
}

/* ===== search/filter ===== */
function applySearchFilter(){
  const q = (searchInput.value || '').trim().toLowerCase();
  const cat = filterCategory.value;
  const filtered = catalog.filter(p => {
    const text = (p.name + ' ' + p.desc + ' ' + p.category).toLowerCase();
    const matchQ = !q || text.includes(q);
    const matchC = !cat || p.category === cat;
    return matchQ && matchC;
  });
  renderProducts(filtered);
}

/* ===== init ===== */
function populateCategories(){
  const cats = Array.from(new Set(PRODUCTS.map(p => p.category))).sort();
  for(const c of cats){
    const opt = document.createElement('option'); opt.value = c; opt.textContent = c;
    filterCategory.appendChild(opt);
  }
}

function init(){
  populateCategories();
  renderProducts(catalog);
  loadCartFromStorage();
  renderCart();
  attachEvents();
}
document.addEventListener('DOMContentLoaded', init);
