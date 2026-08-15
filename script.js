/* =====================================================
   AL JEFOON TENTS — ORDER TRACKER
   CLEAN VERSION 1.1
   No duplicate rendering
===================================================== */

const STORAGE_KEY = "alJefoonOrdersV1";

let orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const $ = id => document.getElementById(id);

const todayISO = () =>
  new Date().toISOString().slice(0, 10);

const currentMonth = () =>
  new Date().toISOString().slice(0, 7);

const money = n =>
  `AED ${Number(n || 0).toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const esc = s =>
  String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));


/* =====================================================
   STORAGE
===================================================== */

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}


/* =====================================================
   STATUS
===================================================== */

function statusFor(order) {
  const total = Number(order.totalAmount || 0);
  const received = Number(order.amountReceived || 0);

  if (total <= 0) return "No Amount";
  if (received >= total) return "Paid";
  if (received > 0) return "Partially Paid";

  return "Pending";
}

function badge(status) {

  const cls = {
    "Paid": "badge-paid",
    "Partially Paid": "badge-partial",
    "Pending": "badge-pending",
    "No Amount": "badge-none"
  }[status] || "badge-none";

  return `
    <span class="badge ${cls}">
      ${esc(status)}
    </span>
  `;
}


/* =====================================================
   MONTH FILTER
===================================================== */

function monthOrders(month) {
  return orders.filter(
    order => order.date?.slice(0, 7) === month
  );
}


/* =====================================================
   FORM
===================================================== */

function resetForm() {

  $("orderForm").reset();

  $("editId").value = "";
  $("orderDate").value = todayISO();
  $("pendingAmount").value = "0.00";

  $("saveOrderBtn").textContent = "Save Order";

  $("itemsContainer").innerHTML = "";

  addItem();
}


function addItem(description = "", quantity = "") {

  const row = document.createElement("div");

  row.className = "item-row";

  row.innerHTML = `
    <input
      class="item-desc"
      placeholder="Item description (e.g. Banquet Chair)"
      value="${esc(description)}"
    >

    <input
      class="item-qty"
      type="number"
      min="0"
      step="1"
      placeholder="Qty"
      value="${esc(quantity)}"
    >

    <button
      type="button"
      class="remove-item"
    >
      ×
    </button>
  `;

  row.querySelector(".remove-item").onclick = () => {
    row.remove();
  };

  $("itemsContainer").appendChild(row);
}


function itemsFromForm() {

  return [...document.querySelectorAll(".item-row")]
    .map(row => ({
      description:
        row.querySelector(".item-desc").value.trim(),

      quantity:
        row.querySelector(".item-qty").value
    }))
    .filter(item =>
      item.description || item.quantity
    );
}


/* =====================================================
   NAVIGATION
===================================================== */

function navTo(section) {

  document
    .querySelectorAll(".section")
    .forEach(s =>
      s.classList.toggle(
        "active",
        s.id === section
      )
    );

  document
    .querySelectorAll(".nav-item")
    .forEach(button =>
      button.classList.toggle(
        "active",
        button.dataset.section === section
      )
    );

  const names = {
    dashboard: "Dashboard",
    "new-order": "New Order",
    orders: "All Orders",
    reports: "Monthly Reports"
  };

  $("pageTitle").textContent =
    names[section] || "Dashboard";

  if (section === "dashboard") {
    renderDashboard();
  }

  if (section === "orders") {
    renderOrders();
  }

  if (section === "reports") {
    renderReport();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =====================================================
   NAVIGATION EVENTS
===================================================== */

document
  .querySelectorAll(".nav-item")
  .forEach(button => {

    button.onclick = () =>
      navTo(button.dataset.section);

  });


document
  .querySelectorAll("[data-go]")
  .forEach(button => {

    button.onclick = () =>
      navTo(button.dataset.go);

  });


$("quickAddBtn").onclick =
$("ordersAddBtn").onclick = () => {

  resetForm();

  navTo("new-order");
};


/* =====================================================
   PAYMENT CALCULATION
===================================================== */

function updatePayment() {

  const total =
    Math.max(
      0,
      Number($("totalAmount").value) || 0
    );

  const received =
    Math.max(
      0,
      Number($("amountReceived").value) || 0
    );

  const actualReceived =
    Math.min(received, total || received);

  const pending =
    Math.max(
      0,
      total - actualReceived
    );

  $("pendingAmount").value =
    pending.toFixed(2);
}


$("totalAmount").oninput =
$("amountReceived").oninput =
updatePayment;


/* =====================================================
   ITEM EVENTS
===================================================== */

$("addItemBtn").onclick = () =>
  addItem();

$("cancelEditBtn").onclick =
resetForm;


/* =====================================================
   SAVE ORDER
===================================================== */

$("orderForm").onsubmit = event => {

  event.preventDefault();

  const total =
    Math.max(
      0,
      Number($("totalAmount").value) || 0
    );

  const received =
    Math.max(
      0,
      Number($("amountReceived").value) || 0
    );

  const actualReceived =
    Math.min(
      received,
      total || received
    );

  const pending =
    Math.max(
      0,
      total - actualReceived
    );

  const obj = {

    id:
      $("editId").value ||
      crypto.randomUUID(),

    date:
      $("orderDate").value,

    jobNo:
      $("jobNo").value.trim(),

    haflaId:
      $("haflaId").value.trim(),

    party:
      $("party").value.trim(),

    incharge:
      $("incharge").value.trim(),

    receivedBy:
      $("receivedBy").value.trim(),

    paymentMethod:
      $("paymentMethod").value,

    totalAmount:
      total,

    amountReceived:
      actualReceived,

    pendingAmount:
      pending,

    status:
      statusFor({
        totalAmount: total,
        amountReceived: actualReceived
      }),

    items:
      itemsFromForm(),

    remarks:
      $("remarks").value.trim()
  };


  const existingIndex =
    orders.findIndex(
      order => order.id === obj.id
    );


  if (existingIndex >= 0) {

    orders[existingIndex] = obj;

  } else {

    orders.push(obj);

  }


  orders.sort((a, b) =>
    (b.date || "").localeCompare(
      a.date || ""
    )
  );


  save();

  toast(
    existingIndex >= 0
      ? "Order updated"
      : "Order saved"
  );

  resetForm();

  navTo("orders");
};


/* =====================================================
   DASHBOARD
===================================================== */

function renderDashboard() {

  const month = currentMonth();

  const data =
    monthOrders(month);


  const totalReceived =
    data.reduce(
      (sum, order) =>
        sum + Number(order.amountReceived || 0),
      0
    );


  const totalPending =
    data.reduce(
      (sum, order) =>
        sum + Number(order.pendingAmount || 0),
      0
    );


  $("dashboardMonth").textContent =
    new Date(month + "-01")
      .toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric"
        }
      );


  $("statOrders").textContent =
    data.length;


  $("statReceived").textContent =
    money(totalReceived);


  $("statPending").textContent =
    money(totalPending);


  $("statPendingOrders").textContent =
    data.filter(order =>
      order.status === "Pending" ||
      order.status === "Partially Paid"
    ).length;


  $("summaryPaid").textContent =
    data.filter(
      order => order.status === "Paid"
    ).length;


  $("summaryPartial").textContent =
    data.filter(
      order => order.status === "Partially Paid"
    ).length;


  $("summaryPending").textContent =
    data.filter(
      order => order.status === "Pending"
    ).length;


  $("summaryNoAmount").textContent =
    data.filter(
      order => order.status === "No Amount"
    ).length;


  /* -------------------------------------------------
     RECENT ORDERS
     Only essential information is shown here.
     Full details remain in All Orders.
  ------------------------------------------------- */

  const recent =
    data
      .slice()
      .sort(
        (a, b) =>
          (b.date || "").localeCompare(
            a.date || ""
          )
      )
      .slice(0, 7);


  $("recentOrdersBody").innerHTML =
    recent.length

      ? recent.map(order => `
          <tr>
            <td>
              ${esc(formatDate(order.date))}
            </td>

            <td>
              <strong>
                ${esc(order.jobNo)}
              </strong>
            </td>

            <td>
              ${esc(order.party)}
            </td>

            <td>
              ${money(order.amountReceived)}
            </td>

            <td>
              ${badge(order.status)}
            </td>
          </tr>
        `).join("")

      : `
          <tr>
            <td
              colspan="5"
              class="empty"
            >
              No orders for this month.
            </td>
          </tr>
        `;
}


/* =====================================================
   DASHBOARD REPORT BUTTON
===================================================== */

$("dashboardReportBtn").onclick = () => {

  $("reportMonth").value =
    currentMonth();

  navTo("reports");
};


/* =====================================================
   ALL ORDERS
===================================================== */

function renderOrders() {

  const search =
    $("searchOrders")
      .value
      .toLowerCase()
      .trim();

  const month =
    $("filterMonth").value;

  const status =
    $("filterStatus").value;


  const filtered =
    orders.filter(order => {

      const searchable = [
        order.jobNo,
        order.party,
        order.haflaId,
        order.incharge,
        order.remarks,

        ...(order.items || [])
          .map(item => item.description)

      ]
        .join(" ")
        .toLowerCase();


      return (

        (!search ||
          searchable.includes(search))

        &&

        (!month ||
          order.date?.startsWith(month))

        &&

        (!status ||
          order.status === status)

      );

    });


  $("ordersBody").innerHTML =

    filtered.length

      ? filtered.map(order => {

          const items =
            (order.items || [])
              .map(item =>
                `${esc(item.description)}${
                  item.quantity
                    ? ` × ${esc(item.quantity)}`
                    : ""
                }`
              )
              .join("<br>") || "—";


          return `
            <tr>

              <td>
                ${esc(formatDate(order.date))}
              </td>

              <td>
                <strong>
                  ${esc(order.jobNo)}
                </strong>
              </td>

              <td>
                ${esc(order.party)}
              </td>

              <td>
                ${items}
              </td>

              <td>
                ${esc(order.incharge)}
              </td>

              <td>
                ${money(order.amountReceived)}
              </td>

              <td>
                ${money(order.pendingAmount)}
              </td>

              <td>
                ${badge(order.status)}
              </td>

              <td>
                <button
                  class="action-btn"
                  onclick="editOrder('${order.id}')"
                >
                  Edit
                </button>

                <button
                  class="action-btn"
                  onclick="deleteOrder('${order.id}')"
                >
                  Delete
                </button>
              </td>

            </tr>
          `;

        }).join("")

      : `
          <tr>
            <td
              colspan="9"
              class="empty"
            >
              No orders match your filters.
            </td>
          </tr>
        `;
}


/* =====================================================
   ORDER FILTERS
===================================================== */

[
  "searchOrders",
  "filterMonth",
  "filterStatus"
].forEach(id => {

  $(id).oninput =
    renderOrders;

});


$("clearFilters").onclick = () => {

  $("searchOrders").value = "";
  $("filterMonth").value = "";
  $("filterStatus").value = "";

  renderOrders();
};


/* =====================================================
   EDIT ORDER
===================================================== */

window.editOrder = id => {

  const order =
    orders.find(
      item => item.id === id
    );

  if (!order) return;


  navTo("new-order");


  $("editId").value =
    order.id;

  $("orderDate").value =
    order.date;

  $("jobNo").value =
    order.jobNo;

  $("haflaId").value =
    order.haflaId;

  $("party").value =
    order.party;

  $("incharge").value =
    order.incharge;

  $("receivedBy").value =
    order.receivedBy;

  $("paymentMethod").value =
    order.paymentMethod;

  $("totalAmount").value =
    order.totalAmount || "";

  $("amountReceived").value =
    order.amountReceived || "";

  $("pendingAmount").value =
    Number(order.pendingAmount || 0)
      .toFixed(2);

  $("status").value =
    "auto";

  $("remarks").value =
    order.remarks || "";


  $("itemsContainer").innerHTML = "";


  const items =
    order.items?.length
      ? order.items
      : [{}];


  items.forEach(item =>
    addItem(
      item.description || "",
      item.quantity || ""
    )
  );


  $("saveOrderBtn").textContent =
    "Update Order";
};


/* =====================================================
   DELETE ORDER
===================================================== */

window.deleteOrder = id => {

  const order =
    orders.find(
      item => item.id === id
    );

  if (!order) return;


  if (
    confirm(
      `Delete ${order.jobNo}? This cannot be undone.`
    )
  ) {

    orders =
      orders.filter(
        item => item.id !== id
      );

    save();

    renderOrders();

    renderDashboard();

    toast("Order deleted");
  }
};


/* =====================================================
   DATE
===================================================== */

function formatDate(date) {

  if (!date) return "—";

  return new Date(
    date + "T00:00:00"
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


/* =====================================================
   MONTHLY REPORT
===================================================== */

function renderReport() {

  const month =
    $("reportMonth").value ||
    currentMonth();


  $("reportMonth").value =
    month;


  const data =
    monthOrders(month);


  const totalReceived =
    data.reduce(
      (sum, order) =>
        sum + Number(order.amountReceived || 0),
      0
    );


  const totalPending =
    data.reduce(
      (sum, order) =>
        sum + Number(order.pendingAmount || 0),
      0
    );


  const label =
    new Date(month + "-01")
      .toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric"
        }
      );


  $("reportPreview").innerHTML = `

    <div class="report-header">

      <div>
        <h2>AL JEFOON TENTS</h2>
        <p>
          Monthly Order & Collection Report
        </p>
      </div>

      <div class="report-title">
        <strong>${label}</strong>
        <span>
          Generated ${formatDate(todayISO())}
        </span>
      </div>

    </div>


    <div class="report-summary">

      <div class="report-box">
        <span>Total Orders</span>
        <strong>${data.length}</strong>
      </div>

      <div class="report-box">
        <span>Total Received</span>
        <strong>
          ${money(totalReceived)}
        </strong>
      </div>

      <div class="report-box">
        <span>Total Pending</span>
        <strong>
          ${money(totalPending)}
        </strong>
      </div>

      <div class="report-box">
        <span>Pending Orders</span>
        <strong>
          ${
            data.filter(order =>
              order.status === "Pending" ||
              order.status === "Partially Paid"
            ).length
          }
        </strong>
      </div>

    </div>


    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Sr#</th>
            <th>Date</th>
            <th>Job #</th>
            <th>HAFLA ID</th>
            <th>Party</th>
            <th>Orders</th>
            <th>Incharge</th>
            <th>Received</th>
            <th>Pending</th>
            <th>Status</th>
          </tr>

        </thead>


        <tbody>

          ${
            data.length

              ? data.map((order, index) => {

                  const items =
                    (order.items || [])
                      .map(item =>
                        `${esc(item.description)}${
                          item.quantity
                            ? ` × ${esc(item.quantity)}`
                            : ""
                        }`
                      )
                      .join("<br>") || "—";


                  return `
                    <tr>

                      <td>
                        ${index + 1}
                      </td>

                      <td>
                        ${formatDate(order.date)}
                      </td>

                      <td>
                        ${esc(order.jobNo)}
                      </td>

                      <td>
                        ${esc(order.haflaId) || "—"}
                      </td>

                      <td>
                        ${esc(order.party)}
                      </td>

                      <td>
                        ${items}
                      </td>

                      <td>
                        ${esc(order.incharge)}
                      </td>

                      <td>
                        ${money(order.amountReceived)}
                      </td>

                      <td>
                        ${money(order.pendingAmount)}
                      </td>

                      <td>
                        ${badge(order.status)}
                      </td>

                    </tr>
                  `;

                }).join("")

              : `
                <tr>
                  <td
                    colspan="10"
                    class="empty"
                  >
                    No orders for ${label}.
                  </td>
                </tr>
              `
          }

        </tbody>

      </table>

    </div>


    <div
      style="
        margin-top:35px;
        display:flex;
        justify-content:space-between;
        font-size:11px;
        color:#777;
      "
    >
      <span>
        Prepared by: ____________________
      </span>

      <span>
        Approved by: ____________________
      </span>
    </div>

  `;
}


/* =====================================================
   REPORT EVENTS
===================================================== */

$("reportMonth").value =
  currentMonth();

$("generateReportBtn").onclick =
  renderReport;

$("printReportBtn").onclick =
  () => window.print();


/* =====================================================
   TOAST
===================================================== */

function toast(message) {

  let toastElement =
    document.querySelector(".toast");


  if (!toastElement) {

    toastElement =
      document.createElement("div");

    toastElement.className =
      "toast";

    document.body.appendChild(
      toastElement
    );
  }


  toastElement.textContent =
    message;

  toastElement.classList.remove(
    "hidden"
  );


  setTimeout(
    () =>
      toastElement.classList.add(
        "hidden"
      ),
    2200
  );
}


/* =====================================================
   INITIALIZE
===================================================== */

$("itemsContainer").innerHTML = "";

resetForm();

renderDashboard();

renderOrders();

renderReport();
