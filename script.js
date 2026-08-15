/* =====================================================
   AL JEFOON TENTS
   ORDER TRACKER
   Version 1.0
===================================================== */

const STORAGE_KEY = "alJefoonOrdersV1";

let orders = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || "[]"
);


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
   STATUS
   Always calculated from payment amounts
===================================================== */

function statusFor(order) {

  const total =
    Number(order.totalAmount || 0);

  const received =
    Number(order.amountReceived || 0);

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
   STATUS BADGE
===================================================== */

function badge(status) {

  const cls = {

    "Received":
      "badge-paid",

    "Partially Received":
      "badge-partial",

    "Pending":
      "badge-pending",

    "No Amount":
      "badge-none"

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
      String(order.date || "")
        .slice(0, 7) === month
  );
}


/* =====================================================
   SORT ORDERS
   Newest date first
   Job number as secondary sort
===================================================== */

function sortOrders() {

  orders.sort((a, b) => {

    const dateCompare =
      String(b.date || "").localeCompare(
        String(a.date || "")
      );

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const jobA =
      parseInt(
        String(a.jobNo || "")
          .replace(/\D/g, ""),
        10
      ) || 0;

    const jobB =
      parseInt(
        String(b.jobNo || "")
          .replace(/\D/g, ""),
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
      String(order.jobNo || "")
        .match(/JB(\d+)/i);

    if (match) {

      const number =
        parseInt(match[1], 10);

      if (number > highest) {
        highest = number;
      }

    }

  });

  return `JB${String(
    highest + 1
  ).padStart(4, "0")}`;
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

  row
    .querySelector(".remove-item")
    .onclick = () =>
      row.remove();

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
    .forEach(button =>
      button.classList.toggle(
        "active",
        button.dataset.section === section
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
    names[section];

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
   ADD ITEM BUTTON
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

  const received =
    Math.max(
      0,
      Number(
        $("amountReceived").value
      ) || 0
    );

  const chosen =
    $("status").value;

  const automaticStatus =
    statusFor({
      totalAmount:
        total,

      amountReceived:
        received
    });

  const itemData =
    itemsFromForm();

  const obj = {

    id:
      $("editId").value ||
      (
        crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now().toString()
      ),

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
        ? automaticStatus
        : chosen,

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
      arr.filter(order => {

        const status =
          statusFor(order);

        return (
          status === "Pending" ||
          status ===
            "Partially Received"
        );

      }).length;


  $("summaryReceived")
    .textContent =
      arr.filter(
        order =>
          statusFor(order) ===
          "Received"
      ).length;


  $("summaryPartial")
    .textContent =
      arr.filter(
        order =>
          statusFor(order) ===
          "Partially Received"
      ).length;


  $("summaryPending")
    .textContent =
      arr.filter(
        order =>
          statusFor(order) ===
          "Pending"
      ).length;


  $("summaryNoAmount")
    .textContent =
      arr.filter(
        order =>
          statusFor(order) ===
          "No Amount"
      ).length;


  const recent =
    arr.slice()
      .sort(
        (a, b) =>
          String(b.date || "")
            .localeCompare(
              String(a.date || "")
            )
      )
      .slice(0, 7);


  $("recentOrdersBody")
    .innerHTML =

      recent.length

        ? recent
            .map(order => {

              const status =
                statusFor(order);

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
                    ${money(
                      order.amountReceived
                    )}
                  </td>

                  <td>
                    ${badge(status)}
                  </td>

                </tr>

              `;

            })
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
   FIXED STATUS FILTER
===================================================== */

function renderOrders() {

  sortOrders();


  const q =
    $("searchOrders").value
      .toLowerCase()
      .trim();


  const month =
    $("filterMonth").value;


  const selectedStatus =
    $("filterStatus").value;


  const arr =
    orders.filter(order => {


      /* -----------------------------
         SEARCH
      ----------------------------- */

      const text = [

        order.jobNo,

        order.party,

        order.haflaId,

        order.incharge,

        order.receivedBy,

        order.remarks,

        ...(order.items || [])
          .map(
            item =>
              item.description
          )

      ]
        .join(" ")
        .toLowerCase();


      const matchesSearch =
        !q ||
        text.includes(q);


      /* -----------------------------
         MONTH
      ----------------------------- */

      const matchesMonth =
        !month ||
        String(
          order.date || ""
        ).startsWith(month);


      /* -----------------------------
         REAL STATUS
         CALCULATED FROM AMOUNTS
      ----------------------------- */

      const realStatus =
        statusFor(order);


      /* -----------------------------
         STATUS FILTER
      ----------------------------- */

      const matchesStatus =
        !selectedStatus ||
        realStatus === selectedStatus;


      return (
        matchesSearch &&
        matchesMonth &&
        matchesStatus
      );

    });


  /* -----------------------------
     DISPLAY ORDERS
  ----------------------------- */

  $("ordersBody").innerHTML =

    arr.length

      ? arr
          .map(order => {

            const items =
              (order.items || [])
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


            const displayStatus =
              statusFor(order);


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
                    displayStatus
                  )}
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
   FIXED
===================================================== */

$("searchOrders")
  .addEventListener(
    "input",
    renderOrders
  );


$("filterMonth")
  .addEventListener(
    "change",
    renderOrders
  );


$("filterStatus")
  .addEventListener(
    "change",
    renderOrders
  );


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
      x => x.id === id
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


  /* -----------------------------
     OLD STATUS COMPATIBILITY
  ----------------------------- */

  let currentStatus =
    statusFor(order);


  if (
    order.status === "Paid"
  ) {

    currentStatus =
      "Received";

  }


  if (
    order.status ===
    "Partially Paid"
  ) {

    currentStatus =
      "Partially Received";

  }


  $("status").value =
    currentStatus || "auto";


  $("remarks").value =
    order.remarks || "";


  $("itemsContainer")
    .innerHTML = "";


  (
    order.items?.length
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
      x => x.id === id
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
        x => x.id !== id
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
          Generated
          ${formatDate(todayISO())}
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
          ${money(received)}
        </strong>

      </div>


      <div class="report-box">

        <span>
          Total Pending
        </span>

        <strong>
          ${money(pending)}
        </strong>

      </div>


      <div class="report-box">

        <span>
          Pending Orders
        </span>

        <strong>
          ${
            arr.filter(order => {

              const status =
                statusFor(order);

              return (
                status === "Pending" ||
                status ===
                  "Partially Received"
              );

            }).length
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
                    (order, index) => {

                      const reportStatus =
                        statusFor(order);


                      return `

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
                              reportStatus
                            )}
                          </td>

                        </tr>

                      `;

                    }
                  )
                  .join("")

              : `

                <tr>

                  <td
                    colspan="11"
                    class="empty"
                  >
                    No orders for
                    ${label}.
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
   CONVERT OLD STATUS VALUES
   Protect existing data
===================================================== */

let dataChanged =
  false;


orders.forEach(order => {

  if (
    order.status ===
    "Paid"
  ) {

    order.status =
      "Received";

    dataChanged =
      true;

  }


  if (
    order.status ===
    "Partially Paid"
  ) {

    order.status =
      "Partially Received";

    dataChanged =
      true;

  }

});


if (dataChanged) {

  save();

}


/* =====================================================
   INITIALIZE
===================================================== */

sortOrders();


$("itemsContainer")
  .innerHTML = "";


resetForm();


renderDashboard();


renderOrders();


renderReport();


updateClock();
