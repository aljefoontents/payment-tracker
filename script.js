const STORAGE_KEY="alJefoonOrdersV1";
let orders=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");

const $=id=>document.getElementById(id);
const todayISO=()=>new Date().toISOString().slice(0,10);
const currentMonth=()=>new Date().toISOString().slice(0,7);
const money=n=>`AED ${Number(n||0).toLocaleString("en-AE",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(orders));}
function statusFor(o){
  if(Number(o.totalAmount)<=0) return "No Amount";
  if(Number(o.amountReceived)>=Number(o.totalAmount)) return "Paid";
  if(Number(o.amountReceived)>0) return "Partially Paid";
  return "Pending";
}
function badge(s){
  const cls={"Paid":"badge-paid","Partially Paid":"badge-partial","Pending":"badge-pending","No Amount":"badge-none"}[s]||"badge-none";
  return `<span class="badge ${cls}">${esc(s)}</span>`;
}
function monthOrders(month){return orders.filter(o=>o.date?.slice(0,7)===month);}
function resetForm(){
  $("orderForm").reset(); $("editId").value=""; $("orderDate").value=todayISO(); $("pendingAmount").value="0.00";
  $("saveOrderBtn").textContent="Save Order"; $("itemsContainer").innerHTML=""; addItem();
}
function addItem(desc="",qty=""){
  const row=document.createElement("div"); row.className="item-row";
  row.innerHTML=`<input class="item-desc" placeholder="Item description (e.g. Banquet Chair)" value="${esc(desc)}"><input class="item-qty" type="number" min="0" step="1" placeholder="Qty" value="${esc(qty)}"><button type="button" class="remove-item">×</button>`;
  row.querySelector(".remove-item").onclick=()=>row.remove(); $("itemsContainer").appendChild(row);
}
function itemsFromForm(){return [...document.querySelectorAll(".item-row")].map(r=>({description:r.querySelector(".item-desc").value.trim(),quantity:r.querySelector(".item-qty").value})).filter(x=>x.description||x.quantity);}
function navTo(section){
  document.querySelectorAll(".section").forEach(s=>s.classList.toggle("active",s.id===section));
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.section===section));
  const names={"dashboard":"Dashboard","new-order":"New Order","orders":"All Orders","reports":"Monthly Reports"};
  $("pageTitle").textContent=names[section];
  if(section==="dashboard") renderDashboard();
  if(section==="orders") renderOrders();
  if(section==="reports") renderReport();
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>navTo(b.dataset.section));
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>navTo(b.dataset.go));
$("quickAddBtn").onclick=$("ordersAddBtn").onclick=()=>{resetForm();navTo("new-order");};

$("totalAmount").oninput=$("amountReceived").oninput=()=>{
  const total=Math.max(0,Number($("totalAmount").value)||0), rec=Math.max(0,Number($("amountReceived").value)||0);
  $("pendingAmount").value=Math.max(0,total-rec).toFixed(2);
};
$("addItemBtn").onclick=()=>addItem();
$("cancelEditBtn").onclick=resetForm;

$("orderForm").onsubmit=e=>{
  e.preventDefault();
  const total=Math.max(0,Number($("totalAmount").value)||0), received=Math.max(0,Number($("amountReceived").value)||0);
  const chosen=$("status").value;
  const auto=statusFor({totalAmount:total,amountReceived:received});
  const itemData=itemsFromForm();
  const obj={
    id:$("editId").value||crypto.randomUUID(),date:$("orderDate").value,jobNo:$("jobNo").value.trim(),haflaId:$("haflaId").value.trim(),
    party:$("party").value.trim(),incharge:$("incharge").value.trim(),receivedBy:$("receivedBy").value.trim(),
    paymentMethod:$("paymentMethod").value,totalAmount:total,amountReceived:Math.min(received,total||received),
    pendingAmount:Math.max(0,total-received),status:chosen==="auto"?auto:chosen,items:itemData,remarks:$("remarks").value.trim()
  };
  const idx=orders.findIndex(x=>x.id===obj.id);
  if(idx>=0) orders[idx]=obj; else orders.push(obj);
  orders.sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  save(); toast(idx>=0?"Order updated":"Order saved"); resetForm(); navTo("orders");
};

function renderDashboard(){
  const mos=currentMonth(), arr=monthOrders(mos);
  const received=arr.reduce((s,o)=>s+Number(o.amountReceived||0),0), pending=arr.reduce((s,o)=>s+Number(o.pendingAmount||0),0);
  $("dashboardMonth").textContent=new Date(mos+"-01").toLocaleDateString("en-US",{month:"long",year:"numeric"});
  $("statOrders").textContent=arr.length;$("statReceived").textContent=money(received);$("statPending").textContent=money(pending);
  $("statPendingOrders").textContent=arr.filter(o=>o.status==="Pending"||o.status==="Partially Paid").length;
  $("summaryPaid").textContent=arr.filter(o=>o.status==="Paid").length;
  $("summaryPartial").textContent=arr.filter(o=>o.status==="Partially Paid").length;
  $("summaryPending").textContent=arr.filter(o=>o.status==="Pending").length;
  $("summaryNoAmount").textContent=arr.filter(o=>o.status==="No Amount").length;
  const recent=arr.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
  $("recentOrdersBody").innerHTML=recent.length?recent.map(o=>`<tr><td>${esc(formatDate(o.date))}</td><td><strong>${esc(o.jobNo)}</strong></td><td>${esc(o.party)}</td><td>${money(o.amountReceived)}</td><td>${badge(o.status)}</td></tr>`).join(""):`<tr><td colspan="5" class="empty">No orders for this month.</td></tr>`;
}
$("dashboardReportBtn").onclick=()=>{ $("reportMonth").value=currentMonth();navTo("reports"); };

function renderOrders(){
  const q=$("searchOrders").value.toLowerCase(), m=$("filterMonth").value, st=$("filterStatus").value;
  let arr=orders.filter(o=>{
    const text=[o.jobNo,o.party,o.haflaId,o.incharge,o.remarks,...(o.items||[]).map(i=>i.description)].join(" ").toLowerCase();
    return (!q||text.includes(q))&&(!m||o.date?.startsWith(m))&&(!st||o.status===st);
  });
  $("ordersBody").innerHTML=arr.length?arr.map(o=>{
    const items=(o.items||[]).map(i=>`${esc(i.description)}${i.quantity?` × ${esc(i.quantity)}`:""}`).join("<br>")||"—";
    return `<tr><td>${esc(formatDate(o.date))}</td><td><strong>${esc(o.jobNo)}</strong></td><td>${esc(o.party)}</td><td>${items}</td><td>${esc(o.incharge)}</td><td>${money(o.amountReceived)}</td><td>${money(o.pendingAmount)}</td><td>${badge(o.status)}</td><td><button class="action-btn" onclick="editOrder('${o.id}')">Edit</button><button class="action-btn" onclick="deleteOrder('${o.id}')">Delete</button></td></tr>`;
  }).join(""):`<tr><td colspan="9" class="empty">No orders match your filters.</td></tr>`;
}
["searchOrders","filterMonth","filterStatus"].forEach(id=>$(id).oninput=renderOrders);
$("clearFilters").onclick=()=>{$("searchOrders").value="";$("filterMonth").value="";$("filterStatus").value="";renderOrders();};

window.editOrder=id=>{
  const o=orders.find(x=>x.id===id);if(!o)return;
  navTo("new-order"); $("editId").value=o.id;$("orderDate").value=o.date;$("jobNo").value=o.jobNo;$("haflaId").value=o.haflaId;
  $("party").value=o.party;$("incharge").value=o.incharge;$("receivedBy").value=o.receivedBy;$("paymentMethod").value=o.paymentMethod;
  $("totalAmount").value=o.totalAmount||"";$("amountReceived").value=o.amountReceived||"";$("pendingAmount").value=o.pendingAmount.toFixed(2);
  $("status").value="auto";$("remarks").value=o.remarks||"";$("itemsContainer").innerHTML="";
  (o.items?.length?o.items:[{}]).forEach(i=>addItem(i.description||"",i.quantity||""));
  $("saveOrderBtn").textContent="Update Order";
};
window.deleteOrder=id=>{
  const o=orders.find(x=>x.id===id);if(!o)return;
  if(confirm(`Delete ${o.jobNo}? This cannot be undone.`)){orders=orders.filter(x=>x.id!==id);save();renderOrders();renderDashboard();toast("Order deleted");}
};

function formatDate(d){if(!d)return"—";return new Date(d+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"});}
function renderReport(){
  const m=$("reportMonth").value||currentMonth(); $("reportMonth").value=m;
  const arr=monthOrders(m), received=arr.reduce((s,o)=>s+Number(o.amountReceived||0),0), pending=arr.reduce((s,o)=>s+Number(o.pendingAmount||0),0);
  const label=new Date(m+"-01").toLocaleDateString("en-US",{month:"long",year:"numeric"});
  $("reportPreview").innerHTML=`
    <div class="report-header"><div><h2>AL JEFOON TENTS</h2><p>Monthly Order & Collection Report</p></div><div class="report-title"><strong>${label}</strong><span>Generated ${formatDate(todayISO())}</span></div></div>
    <div class="report-summary"><div class="report-box"><span>Total Orders</span><strong>${arr.length}</strong></div><div class="report-box"><span>Total Received</span><strong>${money(received)}</strong></div><div class="report-box"><span>Total Pending</span><strong>${money(pending)}</strong></div><div class="report-box"><span>Pending Orders</span><strong>${arr.filter(o=>o.status==="Pending"||o.status==="Partially Paid").length}</strong></div></div>
    <div class="table-wrap"><table><thead><tr><th>Sr#</th><th>Date</th><th>Job #</th><th>HAFLA ID</th><th>Party</th><th>Orders</th><th>Incharge</th><th>Received</th><th>Pending</th><th>Status</th></tr></thead><tbody>
    ${arr.length?arr.map((o,i)=>`<tr><td>${i+1}</td><td>${formatDate(o.date)}</td><td>${esc(o.jobNo)}</td><td>${esc(o.haflaId)||"—"}</td><td>${esc(o.party)}</td><td>${(o.items||[]).map(x=>`${esc(x.description)}${x.quantity?` × ${esc(x.quantity)}`:""}`).join("<br>")||"—"}</td><td>${esc(o.incharge)}</td><td>${money(o.amountReceived)}</td><td>${money(o.pendingAmount)}</td><td>${badge(o.status)}</td></tr>`).join(""):`<tr><td colspan="10" class="empty">No orders for ${label}.</td></tr>`}
    </tbody></table></div>
    <div style="margin-top:35px;display:flex;justify-content:space-between;font-size:11px;color:#777"><span>Prepared by: ____________________</span><span>Approved by: ____________________</span></div>`;
}
$("reportMonth").value=currentMonth();$("generateReportBtn").onclick=renderReport;$("printReportBtn").onclick=()=>window.print();

function toast(msg){let t=document.querySelector(".toast");if(!t){t=document.createElement("div");t.className="toast";document.body.appendChild(t)}t.textContent=msg;t.classList.remove("hidden");setTimeout(()=>t.classList.add("hidden"),2200)}
document.getElementById("itemsContainer").innerHTML="";addItem();resetForm();renderDashboard();renderOrders();renderReport();
