/* Isolated cloud controls. Existing order editing, printing and styles remain in their original files. */
(function() {
  "use strict";
  const APP = "AL JEFOON TENTS - Order Tracker";
  const KEY = "alJefoonOrdersV1";
  const SETTINGS = "alJefoonCloudBackupURL";
  const SECRET = "alJefoonCloudBackupAccessKey";
  const SAFETY = "alJefoonPreRestoreBackupV1";
  const FLAGS = ["alJefoonJuly2026ImportedV1", "alJefoonJune2026ImportedV1", "alJefoonMay2026ImportedV1",
    "alJefoonEarlyMay2026ImportedV1", "alJefoonCompleteMay2026ImportedV2"];
  const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbzN-hhju1kss7zf46kDKQYDXuE5mptq2fie_pi2tCL8GAt8ZWEltWtPW_iRZzuhFGWN/exec";
  let busy = false;
  let preview = null;
  let previewLocal = null;
  let panel;
  function esc(s) {return String(s ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function validate(data) {
    if (!data || data.app !== APP || !Array.isArray(data.orders)) throw new Error("This is not a valid Order Tracker backup.");
    const ids = new Set();
    data.orders.forEach(order=>{
      if (!order || typeof order !== "object" || Array.isArray(order) || typeof order.id !== "string" || !order.id || ids.has(order.id)) throw new Error("Backup has missing or duplicate order IDs.");
      ids.add(order.id);
      if (typeof order.date !== "string" || typeof order.party !== "string" || (order.items !== undefined && !Array.isArray(order.items))) throw new Error("Backup contains invalid order fields.");
      (order.items || []).forEach(item=>{if (!item || (typeof item!=="object" && typeof item!=="string")) throw new Error("Backup contains invalid order items.");});
      ["totalAmount","amountReceived","pendingAmount"].forEach(k=>{
        if (order[k] !== undefined && (typeof order[k] !== "number" || !Number.isFinite(order[k]))) throw new Error("Backup contains invalid amounts.");
      });
    });
    return data;
  }
  function snapshot() {
    const flags = {};
    FLAGS.forEach(k=>{flags[k]=localStorage.getItem(k);});
    return validate({app:APP,version:"2.0",storageKey:KEY,backupDate:new Date().toISOString(),
      orders:JSON.parse(localStorage.getItem(KEY)||"[]"),importFlags:flags});
  }
  function status(message) {panel.querySelector("#cloudStatus").textContent=message;}
  function settings() {
    const url=panel.querySelector("#cloudURL").value.trim();
    const accessKey=panel.querySelector("#cloudKey").value.trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url)) throw new Error("Enter the Google Apps Script web app URL ending in /exec.");
    if (accessKey.length<24) throw new Error("Enter your backup access key (at least 24 characters).");
    localStorage.setItem(SETTINGS,url);
    sessionStorage.setItem(SECRET,accessKey);
    return {url,accessKey};
  }
  function request(action, extra) {
    const config=settings();
    const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
    const requestId=Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
    return new Promise((resolve,reject)=>{
      const frame=document.createElement("iframe");
      frame.name="cloud_"+requestId;frame.hidden=true;frame.setAttribute("aria-hidden","true");
      const form=document.createElement("form");
      form.method="POST";form.action=config.url;form.target=frame.name;form.hidden=true;
      const params=Object.assign({action,requestId,accessKey:config.accessKey,origin:location.origin},extra||{});
      Object.entries(params).forEach(([name,value])=>{
        const input=document.createElement("input");input.type="hidden";input.name=name;input.value=String(value);form.appendChild(input);
      });
      let timer;
      function clean(){clearTimeout(timer);window.removeEventListener("message",receive);frame.remove();form.remove();}
      function receive(event){
        if (!/^https:\/\/(?:script\.google\.com|(?:[a-zA-Z0-9-]+[.-])?script\.googleusercontent\.com)$/.test(event.origin)) return;
        const message=event.data;
        if (!message || message.channel!=="alJefoonCloudBackup" || message.requestId!==requestId) return;
        clean();
        if (!message.result || message.result.success!==true) reject(new Error(message.result && message.result.message || "Cloud request failed."));
        else resolve(message.result);
      }
      window.addEventListener("message",receive);
      timer=setTimeout(()=>{clean();reject(new Error(action==="backup" ? "No confirmation received. The backup may have saved; check the cloud backup list before retrying." : "No cloud response received. Check the deployment, connection and access key."));},45000);
      document.body.appendChild(frame);document.body.appendChild(form);
      try{form.submit();}catch(error){clean();reject(error);}
    });
  }
  async function run(task) {
    if (busy) return;
    busy=true;
    panel.querySelectorAll("button,input,select").forEach(n=>{n.disabled=true;});
    try{await task();}catch(error){status(error.message);}finally{
      busy=false;
      panel.querySelectorAll("button,input,select").forEach(n=>{n.disabled=false;});
    }
  }
  function download(data,name) {
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function clearPreview(){preview=null;previewLocal=null;panel.querySelector("#cloudPreview").textContent="";panel.querySelector("#applyCloudRestore").hidden=true;}
  function showPreview(data) {
    preview=validate(data);
    previewLocal=localStorage.getItem(KEY);
    const received=preview.orders.reduce((n,o)=>n+(o.amountReceived||0),0);
    const pending=preview.orders.reduce((n,o)=>n+(o.pendingAmount||0),0);
    panel.querySelector("#cloudPreview").textContent=preview.orders.length+" orders · Backup: "+(preview.backupDate||"Unknown date")+
      " · Received: "+received.toFixed(2)+" · Pending: "+pending.toFixed(2)+". Restoring replaces the current orders after saving a safety copy.";
    panel.querySelector("#applyCloudRestore").hidden=false;
  }
  function applyRestore() {
    if (!preview) throw new Error("Preview a backup first.");
    if (localStorage.getItem(KEY)!==previewLocal) throw new Error("Your orders changed after preview. Preview the backup again before restoring.");
    validate(preview);
    if (!confirm("Restore these "+preview.orders.length+" orders and replace your current orders? A safety copy will be saved first.")) return;
    const before=snapshot();
    // Abort if the safety copy cannot be saved. Never call save() during restore.
    localStorage.setItem(SAFETY,JSON.stringify(before));
    try {
      FLAGS.forEach(k=>localStorage.setItem(k,"yes")); // Prevent bundled imports from adding deleted orders after reload.
      localStorage.setItem(KEY,JSON.stringify(preview.orders));
    } catch(error) {
      localStorage.setItem(KEY,JSON.stringify(before.orders));
      FLAGS.forEach(k=>{if(before.importFlags[k]===null)localStorage.removeItem(k);else localStorage.setItem(k,before.importFlags[k]);});
      throw error;
    }
    orders=JSON.parse(JSON.stringify(preview.orders));
    sortOrders();renderDashboard();renderOrders();renderReport();
    clearPreview();
    status("Restore completed. Your previous data is available using Download Safety Copy.");
  }
  function open() {
    if(panel){panel.classList.add("show");return;}
    panel=document.createElement("div");panel.id="cloudBackupModal";panel.className="print-options-modal show";
    panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-labelledby","cloudTitle");
    panel.innerHTML=`<div class="print-options-box">
      <h3 id="cloudTitle">Cloud Backup & Restore</h3>
      <p>Save orders in your Google Drive or restore an earlier backup. Backups run only when you click Backup Now.</p>
      <div class="print-option-grid">
        <label>Web app URL<input id="cloudURL" type="url" style="width:100%;box-sizing:border-box;margin:6px 0 12px;" value="${esc(localStorage.getItem(SETTINGS)||DEFAULT_URL)}"></label>
        <label>Backup access key<input id="cloudKey" type="password" autocomplete="off" style="width:100%;box-sizing:border-box;margin:6px 0 12px;" value="${esc(sessionStorage.getItem(SECRET)||"")}"></label>
        <div class="customer-select-buttons" style="display:flex;flex-wrap:wrap;gap:8px;">
          <button type="button" id="cloudTest">Test Connection</button>
          <button type="button" id="cloudBackupNow">Backup Now</button>
          <button type="button" id="cloudList">Load Cloud Backups</button>
          <button type="button" id="cloudDownload">Download Local Backup</button>
          <button type="button" id="cloudSafety">Download Safety Copy</button>
        </div>
        <label>Cloud backup<select id="cloudVersions" style="width:100%;margin:6px 0;"><option value="">Load cloud backups first</option></select></label>
        <div class="customer-select-buttons"><button type="button" id="cloudPreviewButton">Preview Cloud Restore</button></div>
        <label>Or restore a backup file<input id="cloudFile" type="file" accept=".json,application/json" style="width:100%;margin:6px 0;"></label>
        <p id="cloudPreview"></p>
        <p id="cloudStatus" role="status" aria-live="polite">Enter your web app URL and access key, then test the connection.</p>
      </div>
      <div class="print-modal-actions" style="display:flex;gap:8px;justify-content:flex-end;">
        <button type="button" id="cloudClose" class="print-cancel-btn">Close</button>
        <button type="button" id="applyCloudRestore" class="print-action-btn pdf-btn" hidden>Restore Selected Backup</button>
      </div>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector("#cloudTest").onclick=()=>run(async()=>{status("Testing connection…");await request("test");status("Cloud connection verified.");});
    panel.querySelector("#cloudBackupNow").onclick=()=>run(async()=>{
      const data=snapshot();if(!data.orders.length)throw new Error("Empty backups are blocked to protect your cloud data.");
      status("Saving cloud backup…");const result=await request("backup",{payload:JSON.stringify(data)});
      status("Cloud backup verified: "+result.orderCount+" orders · "+result.backupDate);
    });
    panel.querySelector("#cloudList").onclick=()=>run(async()=>{
      clearPreview();status("Loading cloud backups…");const result=await request("list");
      const select=panel.querySelector("#cloudVersions");select.innerHTML="";
      result.backups.forEach(file=>{const option=document.createElement("option");option.value=file.id;option.textContent=file.date+" — "+(file.name==="OrderTracker_Backup.json"?"Latest backup":"Previous backup");select.appendChild(option);});
      status(result.backups.length?result.backups.length+" cloud backup(s) available.":"No cloud backups found yet.");
    });
    panel.querySelector("#cloudVersions").onchange=clearPreview;
    panel.querySelector("#cloudPreviewButton").onclick=()=>run(async()=>{
      clearPreview();const fileId=panel.querySelector("#cloudVersions").value;if(!fileId)throw new Error("Load and select a cloud backup first.");
      status("Loading backup preview…");const result=await request("restore",{fileId});showPreview(result.backup);status("Review the preview, then click Restore Selected Backup.");
    });
    panel.querySelector("#cloudFile").onchange=()=>run(async()=>{
      clearPreview();const file=panel.querySelector("#cloudFile").files[0];if(!file)return;
      if(file.size>5000000)throw new Error("Backup file exceeds 5 MB.");showPreview(JSON.parse(await file.text()));status("Backup file validated. Review the preview before restoring.");
    });
    panel.querySelector("#applyCloudRestore").onclick=()=>run(async()=>applyRestore());
    panel.querySelector("#cloudDownload").onclick=()=>run(async()=>{download(snapshot(),"OrderTracker_Local_Backup.json");status("Local backup downloaded.");});
    panel.querySelector("#cloudSafety").onclick=()=>run(async()=>{const raw=localStorage.getItem(SAFETY);if(!raw)throw new Error("No restore safety copy is available yet.");download(validate(JSON.parse(raw)),"OrderTracker_PreRestore_Backup.json");status("Safety copy downloaded.");});
    const close=()=>{if(!busy)panel.classList.remove("show");};
    panel.querySelector("#cloudClose").onclick=close;
    panel.addEventListener("click",e=>{if(e.target===panel)close();});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panel.classList.contains("show")){e.stopImmediatePropagation();close();}},true);
  }
  document.getElementById("cloudBackupBtn").addEventListener("click",open);
})();
