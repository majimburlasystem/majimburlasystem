const products = [
  { id:'1778004652', name:'Comando Ultra', price:999999999, image:'/static/roblox/thumb/asset/1778004652', meta:'Item raro' },
  { id:'48039287', name:'Fedora Sao Patricio', price:66999, image:'/static/roblox/thumb/asset/48039287', meta:'Item raro' },
  { id:'99641902', name:'NINJABART122', price:34999999, image:'/static/roblox/thumb/asset/99641902', meta:'Item raro' },
  { id:'17402911590', name:'Dragon Fruit', price:120, image:'/static/roblox/thumb/asset/17402911590', meta:'Dragon' },
  { id:'18915829198', name:'SHADOW DRAGON', price:500, image:'/static/roblox/thumb/asset/18915829198', meta:'Dragon' },
  { id:'16613992677', name:'BEST DRAGON', price:359, image:'/static/roblox/thumb/asset/16613992677', meta:'Dragon' },
  { id:'12357436568', name:'FROST DRAGON', price:500, image:'/static/roblox/thumb/asset/12357436568', meta:'Dragon' },
  { id:'blox-fruit-accounts', name:'CONTAS BLOX FRUIT', price:10, image:'/static/roblox/thumb/asset/2753915549', meta:'Clique em Comprar para ver as contas internas', type:'accounts' }
];

const accountUsers = [1,2,3,4,5,6,7,8,9,10,11,12,261,393,496,781,934,1024,1560,2048,2456,3001,4096,5000,7777,9001,10000,11111,12345,15555];
const accountOptions = accountUsers.map((u,i)=>({ id:'bf-'+u, name:'Conta Max Blox Fruits #'+(i+1), price:10+((i%4)*2), image:'/static/roblox/thumb/user/'+u, meta:'Nivel maximo + itens aleatorios' }));

const cart = {};
const fmt = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR');
const $ = (s) => document.querySelector(s);
let avatarUrl = '/static/roblox/thumb/avatar/1';
let walkerEl = null;
let avatarGender = 'masculino';
let waveTimer = null;

function waveAvatar(){
  const head = $('#avatarHead');
  if(!head) return;
  head.classList.remove('waving');
  void head.offsetWidth;
  head.classList.add('waving');
  clearTimeout(waveTimer);
  waveTimer = setTimeout(()=>head.classList.remove('waving'), 1500);
}

async function loadAvatar(){
  try {
    const res = await fetch('/api/me');
    if(!res.ok) return;
    const data = await res.json();
    avatarUrl = data.avatar_url || avatarUrl;
    avatarGender = (data.gender === 'feminino') ? 'feminino' : 'masculino';
    const gClass = avatarGender === 'feminino' ? 'fem' : 'masc';
    const gLabel = avatarGender === 'feminino' ? 'Avatar Feminino' : 'Avatar Masculino';
    const hub = $('#avatarHub');
    if(!hub) return;
    hub.classList.remove('masc', 'fem');
    hub.classList.add(gClass);
    hub.innerHTML = `<div class="avatar-head" id="avatarHead"><img src="${avatarUrl}" alt="Avatar Roblox" /></div><p class="avatar-line">${data.email}</p><p class="avatar-line">Clique no avatar para interagir</p><span class="avatar-tag ${gClass}">${gLabel}</span>`;
    const head = $('#avatarHead');
    if(head){
      head.onclick = () => {
        head.classList.toggle('interact');
        waveAvatar();
        const toast = $('#toast');
        if(toast){
          toast.textContent = 'Avatar interagindo e acenando!';
          toast.classList.add('show');
          setTimeout(()=>toast.classList.remove('show'), 1500);
        }
      };
    }
  } catch (_) {}
}

function ensureWalker(){
  if(walkerEl) return walkerEl;
  walkerEl = document.createElement('div');
  walkerEl.className = 'avatar-walker';
  walkerEl.innerHTML = `<img src="${avatarUrl}" alt="Avatar andando" />`;
  document.body.appendChild(walkerEl);
  return walkerEl;
}

function walkAvatarAcrossSite(){
  const walker = ensureWalker();
  const img = walker.querySelector('img');
  if(img) img.src = avatarUrl;

  const startY = Math.max(120, Math.min(window.innerHeight - 120, window.innerHeight * 0.62));
  const endY = Math.max(120, Math.min(window.innerHeight - 120, window.innerHeight * 0.58));
  const startX = 80;
  const endX = Math.max(120, window.innerWidth - 80);
  const duration = 1600;
  const t0 = performance.now();

  walker.classList.add('walking');
  let raf = null;
  const step = (t) => {
    const p = Math.min(1, (t - t0) / duration);
    const ease = 1 - Math.pow(1 - p, 3);
    const x = startX + (endX - startX) * ease;
    const y = startY + (endY - startY) * ease;
    walker.style.left = `${x}px`;
    walker.style.top = `${y}px`;
    if (p < 1) raf = requestAnimationFrame(step);
    else {
      setTimeout(() => {
        walker.classList.remove('walking');
        walker.style.opacity = '0';
      }, 280);
    }
  };
  if (raf) cancelAnimationFrame(raf);
  requestAnimationFrame(step);
}

function renderProducts(){
  const grid = $('#itemGrid');
  if(!grid) return;
  grid.innerHTML = products.map((p)=>`<article class="card" data-id="${p.id}" data-price="${p.price}" data-item="${p.name}"><img class="item-image" src="${p.image}" alt="${p.name}"><div class="item-body"><h3 class="item-name">${p.name}</h3><div class="item-meta">${p.meta}</div><div class="price-row"><div class="price">${fmt(p.price)}</div><button class="buy">${p.type==='accounts'?'Comprar':'Comprar'}</button></div></div></article>`).join('');
  document.querySelectorAll('#itemGrid .buy').forEach((btn)=>{
    btn.onclick = (e)=>{
      const card = e.target.closest('.card');
      const id = card.dataset.id;
      const p = products.find((x)=>x.id===id);
      if(p.type==='accounts'){ openOverlay('#accounts'); return; }
      addToCart(p.id,p.name,p.price);
    };
  });
}

function renderAccountOptions(){
  const list = $('#accountsList');
  if(!list) return;
  list.innerHTML = accountOptions.map((a)=>`<div class="acc-item"><img src="${a.image}" style="width:100%;max-height:150px;object-fit:cover;border-radius:8px"><div><b>${a.name}</b><div>${a.meta}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;"><span>${fmt(a.price)}</span><button class="buy" data-aid="${a.id}">Adicionar</button></div></div></div>`).join('');
  list.querySelectorAll('[data-aid]').forEach((btn)=>{
    btn.onclick = ()=>{
      const a = accountOptions.find((x)=>x.id===btn.dataset.aid);
      addToCart(a.id,a.name,a.price);
    };
  });
}

function addToCart(id,name,price){
  if(!cart[id]) cart[id] = { id, name, price, qty: 0 };
  cart[id].qty += 1;
  refreshCart();
  waveAvatar();
  walkAvatarAcrossSite();
  openOverlay('#drawer');
}

function setQty(id,qty){
  if(!cart[id]) return;
  cart[id].qty = Math.max(0, qty);
  if(cart[id].qty===0) delete cart[id];
  refreshCart();
}

function refreshCart(){
  const items = Object.values(cart);
  const count = items.reduce((acc,i)=>acc+i.qty,0);
  const countEl = $('#cartCount');
  if(countEl) countEl.textContent = 'Carrinho: ' + count;
  const cartItems = $('#cartItems');
  if(cartItems){
    cartItems.innerHTML = items.length ? items.map((i)=>`<div class="cart-item"><b>${i.name}</b><div>${fmt(i.price)}</div><div class="qty"><button onclick="window.setQty('${i.id}',${i.qty-1})">-</button> <span>${i.qty}</span> <button onclick="window.setQty('${i.id}',${i.qty+1})">+</button></div></div>`).join('') : '<p>Carrinho vazio</p>';
  }
  const totalEl = $('#cartTotal');
  if(totalEl){
    const total = items.reduce((acc,i)=>acc+(i.price*i.qty),0);
    totalEl.textContent = fmt(total);
  }
}

function openOverlay(sel){
  const b = $('#backdrop');
  if(b) b.classList.add('show');
  const panel = $(sel);
  if(panel) panel.classList.add('open');
}

function closeOverlays(){
  const b = $('#backdrop');
  if(b) b.classList.remove('show');
  document.querySelectorAll('.drawer,.checkout,.accounts').forEach((el)=>el.classList.remove('open'));
}

function bindUI(){
  const openCart = $('#openCart'); if(openCart) openCart.onclick = ()=>openOverlay('#drawer');
  const closeDrawer = $('#closeDrawer'); if(closeDrawer) closeDrawer.onclick = closeOverlays;
  const closeCheckout = $('#closeCheckout'); if(closeCheckout) closeCheckout.onclick = closeOverlays;
  const closeAccounts = $('#closeAccounts'); if(closeAccounts) closeAccounts.onclick = closeOverlays;
  const backdrop = $('#backdrop'); if(backdrop) backdrop.onclick = closeOverlays;

  const goCheckout = $('#goCheckout');
  if(goCheckout){
    goCheckout.onclick = ()=>{
      if(!Object.keys(cart).length){ alert('Carrinho vazio'); return; }
      openOverlay('#checkout');
    };
  }

  document.querySelectorAll('.tab').forEach((tab)=>{
    tab.onclick = ()=>{
      document.querySelectorAll('.tab').forEach((t)=>t.classList.remove('active'));
      document.querySelectorAll('.pay-panel').forEach((p)=>p.classList.remove('active'));
      tab.classList.add('active');
      const panel = $('#panel-' + tab.dataset.pay);
      if(panel) panel.classList.add('active');
    };
  });

  const payNow = $('#payNow');
  if(payNow){
    payNow.onclick = async ()=>{
      const items = Object.values(cart).map((i)=>({ id:i.id, qty:i.qty }));
      if(!items.length){ alert('Carrinho vazio'); return; }
      payNow.disabled = true;
      payNow.textContent = 'Abrindo checkout seguro...';
      try{
        const r = await fetch('/api/checkout/create', {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ items })
        });
        const d = await r.json();
        if(!r.ok || !d.ok || !d.checkout_url){
          alert(d.message || 'Falha ao iniciar pagamento.');
          return;
        }
        location.href = d.checkout_url;
      } catch(_){
        alert('Erro de conexao ao iniciar checkout.');
      } finally {
        payNow.disabled = false;
        payNow.textContent = 'Pagar agora';
      }
    };
  }

  const logoutBtn = $('#logoutBtn');
  if(logoutBtn){
    logoutBtn.onclick = async ()=>{ await fetch('/api/logout',{method:'POST'}); location.href='/login'; };
  }
}

window.setQty = setQty;
renderProducts();
renderAccountOptions();
refreshCart();
bindUI();
loadAvatar();
