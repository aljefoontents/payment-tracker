/* =====================================================
   AL JEFOON TENTS
   ORDER TRACKER
   Version 1.0
===================================================== */

const STORAGE_KEY = "alJefoonOrdersV1";

let orders = [];

try {
  orders = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
  );

  if (!Array.isArray(orders)) {
    orders = [];
  }

} catch (error) {
  console.error("Could not load saved orders:", error);
  orders = [];
}


/* =====================================================
   HELPERS
===================================================== */

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
  String(s ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );


/* =====================================================
   SAVE
===================================================== */

function save() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(orders)
  );
}


/* =====================================================
   STATUS CALCULATION
   ALWAYS BASED ON ACTUAL AMOUNTS
===================================================== */

function statusFor(order) {

  const total = Math.max(
    0,
    Number(order.totalAmount || 0)
  );

  const received = Math.max(
    0,
    Number(order.amountReceived || 0)
  );

  if (total <= 0) {
    return "No Amount";
  }

  if (received >= total) {
    return "Received";
  }

  if (received > 0) {
    return "Partially Received";
  }

  return "Pending";
}


/* =====================================================
   NORMALIZE OLD DATA
   Converts old statuses and fixes payment values.
===================================================== */

function normalizeOrders() {

  let changed = false;

  orders = orders.map(order => {

    if (!order || typeof order !== "object") {
      return order;
    }

    const total = Math.max(
      0,
      Number(order.totalAmount || 0)
    );

    let received = Math.max(
      0,
      Number(order.amountReceived || 0)
    );

    if (total > 0) {
      received = Math.min(received, total);
    }

    const pending = Math.max(
      0,
      total - received
    );

    const correctStatus = statusFor({
      totalAmount: total,
      amountReceived: received
    });

    if (
      Number(order.totalAmount || 0) !== total ||
      Number(order.amountReceived || 0) !== received ||
      Number(order.pendingAmount || 0) !== pending ||
      order.status !== correctStatus
    ) {
      changed = true;
    }

    return {
      ...order,

      totalAmount: total,

      amountReceived: received,

      pendingAmount: pending,

      status: correctStatus,

      jobNo: String(order.jobNo || "").trim(),

      date: String(order.date || ""),

      party: String(order.party || ""),

      haflaId: String(order.haflaId || ""),

      incharge: String(order.incharge || ""),

      receivedBy: String(order.receivedBy || ""),

      paymentMethod: String(
        order.paymentMethod || ""
      ),

      remarks: String(order.remarks || ""),

      items: Array.isArray(order.items)
        ? order.items
        : []
    };

  }).filter(Boolean);

  if (changed) {
    save();
  }
}


/* =====================================================
   STATUS BADGE
===================================================== */

function badge(status) {

  const cls = {
    "Received": "badge-paid",
    "Partially Received": "badge-partial",
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
   MONTH ORDERS
===================================================== */

function monthOrders(month) {

  return orders.filter(
    order =>
      String(order.date || "").slice(0, 7) === month
  );
}


/* =====================================================
   SORT ORDERS
   Newest date first.
   Job number used as secondary sort.
===================================================== */

function sortOrders() {

  orders.sort((a, b) => {

    const dateA = String(a.date || "");
    const dateB = String(b.date || "");

    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }

    const jobA =
      parseInt(
        String(a.jobNo || "").replace(/\D/g, ""),
        10
      ) || 0;

    const jobB =
      parseInt(
        String(b.jobNo || "").replace(/\D/g, ""),
        10
      ) || 0;

    return jobB - jobA;
  });
}


/* =====================================================
   AUTOMATIC JOB NUMBER
===================================================== */

function getNextJobNumber() {

  let highest = 0;

  orders.forEach(order => {

    const match =
      String(order.jobNo || "").match(
        /JB(\d+)/i
      );

    if (match) {

      const number =
        parseInt(match[1], 10);

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

  $("orderDate").value =
    todayISO();

  $("jobNo").value =
    getNextJobNumber();

  $("pendingAmount").value =
    "0.00";

  $("status").value =
    "auto";

  $("saveOrderBtn").textContent =
    "Save Order";

  $("itemsContainer").innerHTML =
    "";

  addItem();
}


/* =====================================================
   ADD ITEM
===================================================== */

function addItem(desc = "", qty = "") {

  const row =
    document.createElement("div");

  row.className =
    "item-row";

  row.innerHTML = `

    <input
      class="item-desc"
      placeholder="Item description (e.g. Banquet Chair)"
      value="${esc(desc)}"
    >

    <input
      class="item-qty"
      type="number"
      min="0"
      step="1"
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

  row.querySelector(
    ".remove-item"
  ).onclick = () => row.remove();

  $("itemsContainer")
    .appendChild(row);
}


/* =====================================================
   GET ITEMS
===================================================== */

function itemsFromForm() {

  return [
    ...document.querySelectorAll(
      ".item-row"
    )
  ]
    .map(row => ({

      description:
        row.querySelector(
          ".item-desc"
        ).value.trim(),

      quantity:
        row.querySelector(
          ".item-qty"
        ).value

    }))
    .filter(
      item =>
        item.description ||
        item.quantity
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
    .forEach(b =>
      b.classList.toggle(
        "active",
        b.dataset.section === section
      )
    );

  const names = {

    dashboard:
      "Dashboard",

    "new-order":
      "New Order",

    orders:
      "All Orders",

    reports:
      "Monthly Reports"

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
   NAV BUTTONS
===================================================== */

document
  .querySelectorAll(".nav-item")
  .forEach(button => {

    button.onclick = () =>
      navTo(
        button.dataset.section
      );

  });


document
  .querySelectorAll("[data-go]")
  .forEach(button => {

    button.onclick = () =>
      navTo(
        button.dataset.go
      );

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
   AMOUNT CALCULATION
===================================================== */

function updatePending() {

  const total =
    Math.max(
      0,
      Number(
        $("totalAmount").value
      ) || 0
    );

  const received =
    Math.max(
      0,
      Number(
        $("amountReceived").value
      ) || 0
    );

  $("pendingAmount").value =
    Math.max(
      0,
      total - received
    ).toFixed(2);

}


$("totalAmount").oninput =
  updatePending;

$("amountReceived").oninput =
  updatePending;


/* =====================================================
   ADD ITEM
===================================================== */

$("addItemBtn").onclick = () =>
  addItem();


/* =====================================================
   CLEAR FORM
===================================================== */

$("cancelEditBtn").onclick =
  resetForm;


/* =====================================================
   SAVE ORDER
===================================================== */

$("orderForm").onsubmit = e => {

  e.preventDefault();

  const total =
    Math.max(
      0,
      Number(
        $("totalAmount").value
      ) || 0
    );

  let received =
    Math.max(
      0,
      Number(
        $("amountReceived").value
      ) || 0
    );

  if (total > 0) {
    received =
      Math.min(
        received,
        total
      );
  }

  const itemData =
    itemsFromForm();

  const id =
    $("editId").value ||
    (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : Date.now().toString()
    );

  const obj = {

    id: id,

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
      $("receivedBy").value,

    paymentMethod:
      $("paymentMethod").value,

    totalAmount:
      total,

    amountReceived:
      received,

    pendingAmount:
      Math.max(
        0,
        total - received
      ),

    /*
      IMPORTANT:
      Status is always calculated.
      It is NOT manually overridden.
    */
    status:
      statusFor({
        totalAmount: total,
        amountReceived: received
      }),

    items:
      itemData,

    remarks:
      $("remarks").value.trim()
  };


  const idx =
    orders.findIndex(
      order =>
        order.id === obj.id
    );


  if (idx >= 0) {

    orders[idx] =
      obj;

  } else {

    orders.push(obj);

  }


  sortOrders();

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

  sortOrders();

  const month =
    currentMonth();

  const arr =
    monthOrders(month);


  const received =
    arr.reduce(
      (sum, order) =>
        sum +
        Number(
          order.amountReceived || 0
        ),
      0
    );


  const pending =
    arr.reduce(
      (sum, order) =>
        sum +
        Number(
          order.pendingAmount || 0
        ),
      0
    );


  $("dashboardDateTime")
    .textContent =
      getDigitalDateTime();


  $("statOrders")
    .textContent =
      arr.length;


  $("statReceived")
    .textContent =
      money(received);


  $("statPending")
    .textContent =
      money(pending);


  $("statPendingOrders")
    .textContent =
      arr.filter(
        order =>
          order.status === "Pending" ||
          order.status ===
            "Partially Received"
      ).length;


  $("summaryReceived")
    .textContent =
      arr.filter(
        order =>
          order.status ===
          "Received"
      ).length;


  $("summaryPartial")
    .textContent =
      arr.filter(
        order =>
          order.status ===
          "Partially Received"
      ).length;


  $("summaryPending")
    .textContent =
      arr.filter(
        order =>
          order.status ===
          "Pending"
      ).length;


  $("summaryNoAmount")
    .textContent =
      arr.filter(
        order =>
          order.status ===
          "No Amount"
      ).length;


  const recent =
    arr
      .slice()
      .sort((a, b) => {

        const dateCompare =
          String(b.date || "")
            .localeCompare(
              String(a.date || "")
            );

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return (
          parseInt(
            String(b.jobNo || "")
              .replace(/\D/g, ""),
            10
          ) || 0
        ) -
        (
          parseInt(
            String(a.jobNo || "")
              .replace(/\D/g, ""),
            10
          ) || 0
        );

      })
      .slice(0, 7);


  $("recentOrdersBody")
    .innerHTML =

      recent.length

        ? recent
            .map(order => `

              <tr>

                <td>
                  ${esc(
                    formatDate(
                      order.date
                    )
                  )}
                </td>

                <td>
                  <strong>
                    ${esc(
                      order.jobNo
                    )}
                  </strong>
                </td>

                <td>
                  ${esc(
                    order.party
                  )}
                </td>

                <td>
                  ${money(
                    order.amountReceived
                  )}
                </td>

                <td>
                  ${badge(
                    order.status
                  )}
                </td>

              </tr>

            `)
            .join("")

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

  sortOrders();

  const q =
    $("searchOrders")
      .value
      .toLowerCase()
      .trim();

  const month =
    $("filterMonth").value;

  const selectedStatus =
    $("filterStatus").value;


  const arr =
    orders.filter(order => {

      const text = [

        order.jobNo,

        order.party,

        order.haflaId,

        order.incharge,

        order.receivedBy,

        order.paymentMethod,

        order.remarks,

        ...(order.items || [])
          .map(
            item =>
              item.description
          )

      ]
        .join(" ")
        .toLowerCase();


      /*
        IMPORTANT:
        Filtering uses the normalized
        status stored on every order.
      */

      const matchesSearch =
        !q ||
        text.includes(q);


      const matchesMonth =
        !month ||
        String(
          order.date || ""
        ).startsWith(month);


      const matchesStatus =
        !selectedStatus ||
        order.status === selectedStatus;


      return (
        matchesSearch &&
        matchesMonth &&
        matchesStatus
      );

    });


  $("ordersBody")
    .innerHTML =

      arr.length

        ? arr
            .map(order => {

              const items =
                (
                  order.items || []
                )
                  .map(item =>
                    `${esc(
                      item.description
                    )}
                    ${
                      item.quantity
                        ? ` × ${esc(
                            item.quantity
                          )}`
                        : ""
                    }`
                  )
                  .join("<br>")
                  ||
                  "—";


              return `

                <tr>

                  <td>
                    ${esc(
                      formatDate(
                        order.date
                      )
                    )}
                  </td>

                  <td>
                    <strong>
                      ${esc(
                        order.jobNo
                      )}
                    </strong>
                  </td>

                  <td>
                    ${esc(
                      order.party
                    )}
                  </td>

                  <td>
                    ${items}
                  </td>

                  <td>
                    ${esc(
                      order.incharge
                    )}
                  </td>

                  <td>
                    ${money(
                      order.amountReceived
                    )}
                  </td>

                  <td>
                    ${money(
                      order.pendingAmount
                    )}
                  </td>

                  <td>
                    ${badge(
                      order.status
                    )}
                  </td>

                  <td>

                    <button
                      class="action-btn"
                      onclick="editOrder('${esc(order.id)}')"
                    >
                      Edit
                    </button>

                    <button
                      class="action-btn"
                      onclick="deleteOrder('${esc(order.id)}')"
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              `;

            })
            .join("")

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
   FILTERS
===================================================== */

[
  "searchOrders",
  "filterMonth",
  "filterStatus"
].forEach(id => {

  $(id).addEventListener(
    "input",
    renderOrders
  );

  $(id).addEventListener(
    "change",
    renderOrders
  );

});


$("clearFilters").onclick = () => {

  $("searchOrders").value =
    "";

  $("filterMonth").value =
    "";

  $("filterStatus").value =
    "";

  renderOrders();

};


/* =====================================================
   EDIT ORDER
===================================================== */

window.editOrder = id => {

  const order =
    orders.find(
      item =>
        item.id === id
    );

  if (!order) {
    return;
  }


  navTo("new-order");


  $("editId").value =
    order.id;


  $("orderDate").value =
    order.date;


  $("jobNo").value =
    order.jobNo;


  $("haflaId").value =
    order.haflaId || "";


  $("party").value =
    order.party || "";


  $("incharge").value =
    order.incharge || "";


  $("receivedBy").value =
    order.receivedBy || "";


  $("paymentMethod").value =
    order.paymentMethod || "";


  $("totalAmount").value =
    order.totalAmount || "";


  $("amountReceived").value =
    order.amountReceived || "";


  $("pendingAmount").value =
    Number(
      order.pendingAmount || 0
    ).toFixed(2);


  /*
    Status is recalculated.
    It cannot become incorrect
    because of old data.
  */

  $("status").value =
    statusFor(order);


  $("remarks").value =
    order.remarks || "";


  $("itemsContainer")
    .innerHTML = "";


  (
    order.items &&
    order.items.length
      ? order.items
      : [{}]
  )
    .forEach(item =>
      addItem(
        item.description || "",
        item.quantity || ""
      )
    );


  $("saveOrderBtn")
    .textContent =
      "Update Order";
};


/* =====================================================
   DELETE ORDER
===================================================== */

window.deleteOrder = id => {

  const order =
    orders.find(
      item =>
        item.id === id
    );

  if (!order) {
    return;
  }


  if (
    confirm(
      `Delete ${order.jobNo}? This cannot be undone.`
    )
  ) {

    orders =
      orders.filter(
        item =>
          item.id !== id
      );

    save();

    renderOrders();

    renderDashboard();

    toast(
      "Order deleted"
    );
  }
};


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(date) {

  if (!date) {
    return "—";
  }

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
   DIGITAL DATE + TIME
===================================================== */

function getDigitalDateTime() {

  const now =
    new Date();


  const date =
    now.toLocaleDateString(
      "en-GB",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    );


  const time =
    now.toLocaleTimeString(
      "en-AE",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }
    );


  return `${date} • ${time}`;
}


/* =====================================================
   LIVE CLOCK
===================================================== */

function updateClock() {

  const clock =
    $("dashboardDateTime");

  if (clock) {

    clock.textContent =
      getDigitalDateTime();

  }
}


setInterval(
  updateClock,
  1000
);


/* =====================================================
   MONTHLY REPORT
===================================================== */

function renderReport() {

  const month =
    $("reportMonth").value ||
    currentMonth();


  $("reportMonth").value =
    month;


  const arr =
    monthOrders(month);


  const received =
    arr.reduce(
      (sum, order) =>
        sum +
        Number(
          order.amountReceived || 0
        ),
      0
    );


  const pending =
    arr.reduce(
      (sum, order) =>
        sum +
        Number(
          order.pendingAmount || 0
        ),
      0
    );


  const label =
    new Date(
      month + "-01"
    ).toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric"
      }
    );


  $("reportPreview")
    .innerHTML = `

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
          Generated
          ${formatDate(
            todayISO()
          )}
        </span>

      </div>

    </div>


    <div class="report-summary">

      <div class="report-box">

        <span>
          Total Orders
        </span>

        <strong>
          ${arr.length}
        </strong>

      </div>


      <div class="report-box">

        <span>
          Total Received
        </span>

        <strong>
          ${money(
            received
          )}
        </strong>

      </div>


      <div class="report-box">

        <span>
          Total Pending
        </span>

        <strong>
          ${money(
            pending
          )}
        </strong>

      </div>


      <div class="report-box">

        <span>
          Pending Orders
        </span>

        <strong>
          ${
            arr.filter(
              order =>
                order.status ===
                  "Pending" ||
                order.status ===
                  "Partially Received"
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
            <th>Received By</th>
            <th>Status</th>

          </tr>

        </thead>


        <tbody>

          ${
            arr.length

              ? arr
                  .map(
                    (order, index) => `

                      <tr>

                        <td>
                          ${index + 1}
                        </td>

                        <td>
                          ${formatDate(
                            order.date
                          )}
                        </td>

                        <td>
                          ${esc(
                            order.jobNo
                          )}
                        </td>

                        <td>
                          ${
                            esc(
                              order.haflaId
                            ) || "—"
                          }
                        </td>

                        <td>
                          ${esc(
                            order.party
                          )}
                        </td>

                        <td>
                          ${
                            (
                              order.items ||
                              []
                            )
                              .map(
                                item =>
                                  `${esc(
                                    item.description
                                  )}
                                  ${
                                    item.quantity
                                      ? ` × ${esc(
                                          item.quantity
                                        )}`
                                      : ""
                                  }`
                              )
                              .join("<br>")
                              ||
                              "—"
                          }
                        </td>

                        <td>
                          ${esc(
                            order.incharge
                          )}
                        </td>

                        <td>
                          ${money(
                            order.amountReceived
                          )}
                        </td>

                        <td>
                          ${money(
                            order.pendingAmount
                          )}
                        </td>

                        <td>
                          ${
                            esc(
                              order.receivedBy
                            ) || "—"
                          }
                        </td>

                        <td>
                          ${badge(
                            order.status
                          )}
                        </td>

                      </tr>

                    `
                  )
                  .join("")

              : `

                <tr>

                  <td
                    colspan="11"
                    class="empty"
                  >
                    No orders for
                    ${esc(label)}.
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

function toast(message) {

  let t =
    document.querySelector(
      ".toast"
    );


  if (!t) {

    t =
      document.createElement(
        "div"
      );

    t.className =
      "toast";

    document.body.appendChild(t);
  }


  t.textContent =
    message;


  t.classList.remove(
    "hidden"
  );


  setTimeout(
    () =>
      t.classList.add(
        "hidden"
      ),
    2200
  );
}


/* =====================================================
   INITIALIZE EXISTING DATA
===================================================== */

/*
  This is important.

  Any old records containing:
  Paid
  Partially Paid
  Received
  Partially Received
  Pending
  No Amount

  will now be recalculated from the
  actual Total Amount and Amount Received.

  Your existing localStorage data is preserved.
*/

normalizeOrders();

sortOrders();

save();


/* =====================================================
   INITIALIZE FORM
===================================================== */

$("itemsContainer")
  .innerHTML = "";

resetForm();

renderDashboard();

renderOrders();

renderReport();

updateClock();
