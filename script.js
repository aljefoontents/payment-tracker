const STORAGE_KEY = "alJefoonOrdersV1";
let orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const $ = id => document.getElementById(id);

const todayISO = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => new Date().toISOString().slice(0, 7);

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

function statusFor(o) {
  if (Number(o.totalAmount) <= 0) return "No Amount";

  if (Number(o.amountReceived) >= Number(o.totalAmount)) {
    return "Paid";
  }

  if (Number(o.amountReceived) > 0) {
    return "Partially Paid";
  }

  return "Pending";
}

function badge(s) {
  const cls = {
    "Paid": "badge-paid",
    "Partially Paid": "badge-partial",
    "Pending": "badge-pending",
    "No Amount": "badge-none"
  }[s] || "badge-none";

  return `<span class="badge ${cls}">${esc(s)}</span>`;
}


/* =====================================================
   DATE / MONTH
===================================================== */

function monthOrders(month) {
  return orders.filter(o => o.date?.slice(0, 7) === month);
}

function formatDate(d) {
  if (!d) return "—";

  return new Date(d + "T00:00:00").toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


/* =====================================================
   AUTOMATIC JOB NUMBER
   Starts from JB0433 because JB0419-JB0432 already exist.
===================================================== */

function getNextJobNumber() {

  let highest = 0;

  orders.forEach(order => {

    const match = String(order.jobNo || "")
      .toUpperCase()
      .match(/^JB(\d+)$/);

    if (match) {
      const number = parseInt(match[1], 10);

      if (number > highest) {
        highest = number;
      }
    }

  });

  return `JB${String(highest + 1).padStart(4, "0")}`;
}


/* =====================================================
   RESET FORM
===================================================== */

function resetForm() {

  $("orderForm").reset();

  $("editId").value = "";

  $("orderDate").value = todayISO();

  $("jobNo").value = getNextJobNumber();

  $("pendingAmount").value = "0.00";

  $("saveOrderBtn").textContent = "Save Order";

  $("itemsContainer").innerHTML = "";

  addItem();
}


/* =====================================================
   ORDER ITEMS
===================================================== */

function addItem(desc = "", qty = "") {

  const row = document.createElement("div");

  row.className = "item-row";

  row.innerHTML = `
    <input
      class="item-desc"
      placeholder="Item description (e.g. Banquet Chair)"
      value="${esc(desc)}"
    >

    <input
      class="item-qty"
      type="text"
      placeholder="Qty"
      value="${esc(qty)}"
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

  return [
    ...document.querySelectorAll(".item-row")
  ]
    .map(r => ({
      description: r.querySelector(".item-desc").value.trim(),
      quantity: r.querySelector(".item-qty").value.trim()
    }))
    .filter(x => x.description || x.quantity);
}


/* =====================================================
   NAVIGATION
===================================================== */

function navTo(section) {

  document.querySelectorAll(".section").forEach(s => {
    s.classList.toggle("active", s.id === section);
  });

  document.querySelectorAll(".nav-item").forEach(b => {
    b.classList.toggle(
      "active",
      b.dataset.section === section
    );
  });

  const names = {
    dashboard: "Dashboard",
    "new-order": "New Order",
    orders: "All Orders",
    reports: "Monthly Reports"
  };

  $("pageTitle").textContent = names[section];

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
   NAVIGATION BUTTONS
===================================================== */

document.querySelectorAll(".nav-item").forEach(b => {
  b.onclick = () => navTo(b.dataset.section);
});

document.querySelectorAll("[data-go]").forEach(b => {
  b.onclick = () => navTo(b.dataset.go);
});


/* =====================================================
   NEW ORDER BUTTONS
===================================================== */

$("quickAddBtn").onclick = () => {
  resetForm();
  navTo("new-order");
};

$("ordersAddBtn").onclick = () => {
  resetForm();
  navTo("new-order");
};


/* =====================================================
   PAYMENT CALCULATION
===================================================== */

$("totalAmount").oninput =
$("amountReceived").oninput = () => {

  const total = Math.max(
    0,
    Number($("totalAmount").value) || 0
  );

  const received = Math.max(
    0,
    Number($("amountReceived").value) || 0
  );

  $("pendingAmount").value =
    Math.max(0, total - received).toFixed(2);
};


/* =====================================================
   ITEM BUTTONS
===================================================== */

$("addItemBtn").onclick = () => addItem();

$("cancelEditBtn").onclick = resetForm;


/* =====================================================
   SAVE / UPDATE ORDER
===================================================== */

$("orderForm").onsubmit = e => {

  e.preventDefault();

  const total = Math.max(
    0,
    Number($("totalAmount").value) || 0
  );

  const received = Math.max(
    0,
    Number($("amountReceived").value) || 0
  );

  const chosen = $("status").value;

  const auto = statusFor({
    totalAmount: total,
    amountReceived: received
  });

  const itemData = itemsFromForm();

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
      Math.min(
        received,
        total || received
      ),

    pendingAmount:
      Math.max(
        0,
        total - received
      ),

    status:
      chosen === "auto"
        ? auto
        : chosen,

    items:
      itemData,

    remarks:
      $("remarks").value.trim()
  };


  /* Prevent duplicate Job Numbers */

  const duplicateJob = orders.find(
    o =>
      o.jobNo.toLowerCase() === obj.jobNo.toLowerCase() &&
      o.id !== obj.id
  );

  if (duplicateJob) {

    toast(
      `Job number ${obj.jobNo} already exists.`
    );

    return;
  }


  const idx = orders.findIndex(
    x => x.id === obj.id
  );


  if (idx >= 0) {

    orders[idx] = obj;

  } else {

    orders.push(obj);

  }


  orders.sort(
    (a, b) =>
      (b.date || "").localeCompare(
        a.date || ""
      )
  );


  save();

  toast(
    idx >= 0
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

  const mos = currentMonth();

  const arr = monthOrders(mos);

  const received =
    arr.reduce(
      (s, o) =>
        s + Number(o.amountReceived || 0),
      0
    );

  const pending =
    arr.reduce(
      (s, o) =>
        s + Number(o.pendingAmount || 0),
      0
    );


  $("dashboardMonth").textContent =
    new Date(
      mos + "-01"
    ).toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric"
      }
    );


  $("statOrders").textContent =
    arr.length;

  $("statReceived").textContent =
    money(received);

  $("statPending").textContent =
    money(pending);

  $("statPendingOrders").textContent =
    arr.filter(
      o =>
        o.status === "Pending" ||
        o.status === "Partially Paid"
    ).length;


  $("summaryPaid").textContent =
    arr.filter(
      o => o.status === "Paid"
    ).length;

  $("summaryPartial").textContent =
    arr.filter(
      o => o.status === "Partially Paid"
    ).length;

  $("summaryPending").textContent =
    arr.filter(
      o => o.status === "Pending"
    ).length;

  $("summaryNoAmount").textContent =
    arr.filter(
      o => o.status === "No Amount"
    ).length;


  const recent =
    arr
      .slice()
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date)
      )
      .slice(0, 7);


  $("recentOrdersBody").innerHTML =
    recent.length

      ? recent.map(o => `
          <tr>
            <td>${esc(formatDate(o.date))}</td>

            <td>
              <strong>
                ${esc(o.jobNo)}
              </strong>
            </td>

            <td>
              ${esc(o.party)}
            </td>

            <td>
              ${money(o.amountReceived)}
            </td>

            <td>
              ${badge(o.status)}
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
   DASHBOARD REPORT
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

  const q =
    $("searchOrders").value
      .toLowerCase();

  const m =
    $("filterMonth").value;

  const st =
    $("filterStatus").value;


  let arr = orders.filter(o => {

    const text = [
      o.jobNo,
      o.party,
      o.haflaId,
      o.incharge,
      o.receivedBy,
      o.remarks,

      ...(o.items || [])
        .map(i => i.description)

    ]
      .join(" ")
      .toLowerCase();


    return (

      (!q || text.includes(q)) &&

      (!m ||
        o.date?.startsWith(m)) &&

      (!st ||
        o.status === st)

    );

  });


  $("ordersBody").innerHTML =

    arr.length

      ? arr.map(o => {

          const items =
            (o.items || [])
              .map(i =>
                `${esc(i.description)}${
                  i.quantity
                    ? ` × ${esc(i.quantity)}`
                    : ""
                }`
              )
              .join("<br>") || "—";


          return `
            <tr>

              <td>
                ${esc(formatDate(o.date))}
              </td>

              <td>
                <strong>
                  ${esc(o.jobNo)}
                </strong>
              </td>

              <td>
                ${esc(o.party)}
              </td>

              <td>
                ${items}
              </td>

              <td>
                ${esc(o.incharge)}
              </td>

              <td>
                ${money(o.amountReceived)}
              </td>

              <td>
                ${money(o.pendingAmount)}
              </td>

              <td>
                ${badge(o.status)}
              </td>

              <td>

                <button
                  class="action-btn"
                  onclick="editOrder('${o.id}')"
                >
                  Edit
                </button>

                <button
                  class="action-btn"
                  onclick="deleteOrder('${o.id}')"
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

  const o =
    orders.find(
      x => x.id === id
    );

  if (!o) return;


  navTo("new-order");


  $("editId").value =
    o.id;

  $("orderDate").value =
    o.date;

  $("jobNo").value =
    o.jobNo;

  $("haflaId").value =
    o.haflaId;

  $("party").value =
    o.party;

  $("incharge").value =
    o.incharge;

  $("receivedBy").value =
    o.receivedBy || "";

  $("paymentMethod").value =
    o.paymentMethod || "";

  $("totalAmount").value =
    o.totalAmount || "";

  $("amountReceived").value =
    o.amountReceived || "";

  $("pendingAmount").value =
    Number(o.pendingAmount || 0)
      .toFixed(2);

  $("status").value =
    "auto";

  $("remarks").value =
    o.remarks || "";


  $("itemsContainer").innerHTML = "";


  (
    o.items?.length
      ? o.items
      : [{}]
  ).forEach(i => {

    addItem(
      i.description || "",
      i.quantity || ""
    );

  });


  $("saveOrderBtn").textContent =
    "Update Order";
};


/* =====================================================
   DELETE ORDER
===================================================== */

window.deleteOrder = id => {

  const o =
    orders.find(
      x => x.id === id
    );

  if (!o) return;


  if (
    confirm(
      `Delete ${o.jobNo}? This cannot be undone.`
    )
  ) {

    orders =
      orders.filter(
        x => x.id !== id
      );

    save();

    renderOrders();

    renderDashboard();

    toast("Order deleted");

  }

};


/* =====================================================
   MONTHLY REPORT
===================================================== */

function renderReport() {

  const m =
    $("reportMonth").value ||
    currentMonth();

  $("reportMonth").value =
    m;


  const arr =
    monthOrders(m);


  const received =
    arr.reduce(
      (s, o) =>
        s + Number(o.amountReceived || 0),
      0
    );


  const pending =
    arr.reduce(
      (s, o) =>
        s + Number(o.pendingAmount || 0),
      0
    );


  const label =
    new Date(
      m + "-01"
    ).toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric"
      }
    );


  $("reportPreview").innerHTML = `

    <div class="report-header">

      <div>

        <h2>
          AL JEFOON TENTS
        </h2>

        <p>
          Monthly Order & Collection Report
        </p>

      </div>

      <div class="report-title">

        <strong>
          ${label}
        </strong>

        <span>
          Generated ${formatDate(todayISO())}
        </span>

      </div>

    </div>


    <div class="report-summary">

      <div class="report-box">
        <span>Total Orders</span>
        <strong>${arr.length}</strong>
      </div>

      <div class="report-box">
        <span>Total Received</span>
        <strong>${money(received)}</strong>
      </div>

      <div class="report-box">
        <span>Total Pending</span>
        <strong>${money(pending)}</strong>
      </div>

      <div class="report-box">
        <span>Pending Orders</span>

        <strong>
          ${
            arr.filter(
              o =>
                o.status === "Pending" ||
                o.status === "Partially Paid"
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
            arr.length

              ? arr.map((o, i) => `

                <tr>

                  <td>
                    ${i + 1}
                  </td>

                  <td>
                    ${formatDate(o.date)}
                  </td>

                  <td>
                    ${esc(o.jobNo)}
                  </td>

                  <td>
                    ${esc(o.haflaId) || "—"}
                  </td>

                  <td>
                    ${esc(o.party)}
                  </td>

                  <td>
                    ${
                      (o.items || [])
                        .map(x =>
                          `${esc(x.description)}${
                            x.quantity
                              ? ` × ${esc(x.quantity)}`
                              : ""
                          }`
                        )
                        .join("<br>") || "—"
                    }
                  </td>

                  <td>
                    ${esc(o.incharge)}
                  </td>

                  <td>
                    ${money(o.amountReceived)}
                  </td>

                  <td>
                    ${money(o.pendingAmount)}
                  </td>

                  <td>
                    ${badge(o.status)}
                  </td>

                </tr>

              `).join("")

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
   REPORT BUTTONS
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

function toast(msg) {

  let t =
    document.querySelector(".toast");


  if (!t) {

    t =
      document.createElement("div");

    t.className =
      "toast";

    document.body.appendChild(t);

  }


  t.textContent =
    msg;

  t.classList.remove(
    "hidden"
  );


  setTimeout(() => {

    t.classList.add(
      "hidden"
    );

  }, 2200);
}


/* =====================================================
   EXISTING ORDERS
   JB0419 - JB0432
===================================================== */

const IMPORTED_ORDERS = [

  {
    id: "JB0419",
    date: "2026-08-01",
    jobNo: "JB0419",
    haflaId: "",
    party: "Private Customer",
    incharge: "Saud",
    receivedBy: "Zohaib",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 170,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Banquet Chair",
        quantity: "10"
      }
    ],
    remarks: ""
  },


  {
    id: "JB0420",
    date: "2026-08-01",
    jobNo: "JB0420",
    haflaId: "",
    party: "Private Customer",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 1500,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Sofa",
        quantity: "10"
      },
      {
        description: "Cooler",
        quantity: "2"
      },
      {
        description: "Coffee Table",
        quantity: "3"
      },
      {
        description: "Buffet Table",
        quantity: "1"
      }
    ],
    remarks:
      "Received 3000.00 for JB0417, JB0420. Transferred 2500 to Bank"
  },


  {
    id: "JB0421",
    date: "2026-08-01",
    jobNo: "JB0421",
    haflaId: "",
    party: "Sikandar",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Round Dish",
        quantity: "10"
      },
      {
        description: "Spoon",
        quantity: "10+10"
      }
    ],
    remarks: ""
  },


  {
    id: "JB0422",
    date: "2026-08-01",
    jobNo: "JB0422",
    haflaId: "",
    party: "Shj Events (Usman)",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Golden Chiavari",
        quantity: "50"
      },
      {
        description: "Buffet Table",
        quantity: "2"
      },
      {
        description: "Cover",
        quantity: "7"
      }
    ],
    remarks: ""
  },


  {
    id: "JB0423",
    date: "2026-08-06",
    jobNo: "JB0423",
    haflaId: "",
    party: "Allah Baksh",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "White Chiavari",
        quantity: "10"
      },
      {
        description: "Buffet Table",
        quantity: "1"
      }
    ],
    remarks: ""
  },


  {
    id: "JB0424",
    date: "2026-08-07",
    jobNo: "JB0424",
    haflaId: "",
    party: "Ismail",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 100,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Mist Fan",
        quantity: "3"
      }
    ],
    remarks: ""
  },


  {
    id: "JB0425",
    date: "2026-08-07",
    jobNo: "JB0425",
    haflaId: "",
    party: "Private Customer",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 600,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Majlis for 15pax",
        quantity: ""
      }
    ],
    remarks: ""
  },


  {
    id: "JB0426",
    date: "2026-08-08",
    jobNo: "JB0426",
    haflaId: "",
    party: "Magic Kidz Nursery",
    incharge: "Saud",
    receivedBy: "Bank",
    paymentMethod: "Bank",
    totalAmount: 0,
    amountReceived: 280,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Plastic Chair",
        quantity: "90"
      }
    ],
    remarks: ""
  },


  {
    id: "JB0427",
    date: "2026-08-08",
    jobNo: "JB0427",
    haflaId: "",
    party: "Private Customer",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Banquet Chair",
        quantity: "40"
      },
      {
        description: "Round Table",
        quantity: "6"
      }
    ],
    remarks: ""
  },


  {
    id: "JB0428",
    date: "2026-08-08",
    jobNo: "JB0428",
    haflaId: "",
    party: "Ajmal",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Buffet Table",
        quantity: "6"
      },
      {
        description: "Banquet Chair",
        quantity: "6"
      }
    ],
    remarks: ""
  },


  {
    id: "JB0429",
    date: "2026-08-08",
    jobNo: "JB0429",
    haflaId: "",
    party: "Moshi Restaurant 7/8/26",
    incharge: "Saud",
    receivedBy: "Bank",
    paymentMethod: "Bank",
    totalAmount: 0,
    amountReceived: 1260,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Tower AC",
        quantity: "1"
      }
    ],
    remarks: ""
  },


  {
    id: "JB0430",
    date: "2026-08-14",
    jobNo: "JB0430",
    haflaId: "",
    party: "Shj Events (Usman)",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Coolers",
        quantity: "18"
      }
    ],
    remarks: ""
  },


  {
    id: "JB0431",
    date: "2026-08-14",
    jobNo: "JB0431",
    haflaId: "",
    party: "Spicy Land",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Tables",
        quantity: "4"
      }
    ],
    remarks: ""
  },


  {
    id: "JB0432",
    date: "2026-08-14",
    jobNo: "JB0432",
    haflaId: "",
    party: "Shj Events (Usman)",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Welcome Carpet",
        quantity: "60m"
      }
    ],
    remarks: ""
  }

];


/* =====================================================
   IMPORT EXISTING ORDERS ONLY ONCE
===================================================== */

function importExistingOrders() {

  const existingJobs =
    new Set(
      orders.map(
        order => order.jobNo
      )
    );


  const newOrders =
    IMPORTED_ORDERS.filter(
      order =>
        !existingJobs.has(
          order.jobNo
        )
    );


  if (newOrders.length === 0) {
    return;
  }


  orders.push(
    ...newOrders
  );


  orders.sort(
    (a, b) =>
      (b.date || "").localeCompare(
        a.date || ""
      )
  );


  save();
}


/* =====================================================
   INITIALIZE
===================================================== */

importExistingOrders();

$("itemsContainer").innerHTML = "";

addItem();

resetForm();

renderDashboard();

renderOrders();

renderReport();
