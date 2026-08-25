/* =====================================================
   AL JEFOON TENTS
   ORDER TRACKER
   Version 1.0
===================================================== */

const STORAGE_KEY = "alJefoonOrdersV1";
const JULY_IMPORT_KEY = "alJefoonJuly2026ImportedV1";

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


/* =====================================================
   MONEY
   AED REMOVED
===================================================== */

const money = n =>
  Number(n || 0).toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });


/* =====================================================
   ESCAPE HTML
===================================================== */

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
   GOOGLE DRIVE BACKUP
===================================================== */

const GOOGLE_BACKUP_URL =
  "https://script.google.com/macros/s/AKfycbzN-hhju1kss7zf46kDKQYDXuE5mptq2fie_pi2tCL8GAt8ZWEltWtPW_iRZzuhFGWN/exec";


let backupTimer = null;


/* =====================================================
   SAVE LOCALLY + GOOGLE DRIVE BACKUP
===================================================== */

function save() {

  /*
    Always save locally first.
    The application continues working
    even if the internet is unavailable.
  */

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(orders)
  );


  /*
    Send the backup shortly after saving.
    The delay prevents multiple quick changes
    from sending many backup requests.
  */

  clearTimeout(backupTimer);


  backupTimer = setTimeout(
    () => backupToGoogleDrive(),
    800
  );

}


/* =====================================================
   BACKUP TO GOOGLE DRIVE
===================================================== */

async function backupToGoogleDrive() {

  try {

    const backupData = {

      app:
        "AL JEFOON TENTS - Order Tracker",

      version:
        "1.0",

      storageKey:
        STORAGE_KEY,

      backupDate:
        new Date().toISOString(),

      orders:
        orders

    };


    await fetch(
      GOOGLE_BACKUP_URL,
      {

        method: "POST",

        mode: "no-cors",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body:
          JSON.stringify(
            backupData
          )

      }
    );


    console.log(
      "Order Tracker Google Drive backup sent."
    );


  } catch (error) {

    /*
      Backup failure must never stop
      the Order Tracker itself.
    */

    console.error(
      "Google Drive backup failed:",
      error
    );

  }

}


/* =====================================================
   AUTOMATIC STATUS
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
      order.date &&
      order.date.slice(0, 7) === month
  );

}


/* =====================================================
   SORT ORDERS
   Newest date first
   Job number secondary
===================================================== */

function sortOrders() {

  orders.sort((a, b) => {

    const dateA =
      String(a.date || "");

    const dateB =
      String(b.date || "");

    const dateCompare =
      dateB.localeCompare(dateA);

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
   JULY 2026 IMPORT DATA
   37 ORDERS
===================================================== */

const JULY_2026_ORDERS = [

  /* 1 */
  {
    id: "july-2026-01",
    date: "2026-07-02",
    jobNo: "",
    haflaId: "28303",
    party: "HAFLA",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 766.50,
    amountReceived: 0,
    pendingAmount: 766.50,
    status: "Pending",
    items: [
      {
        description: "Banquet Chairs with White Stretch",
        quantity: 80
      }
    ],
    remarks: ""
  },


  /* 2 */
  {
    id: "july-2026-02",
    date: "2026-07-03",
    jobNo: "JB0394",
    haflaId: "",
    party: "Allah Baksh",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 300,
    amountReceived: 300,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Air Cooler",
        quantity: 2
      }
    ],
    remarks: ""
  },


  /* 3 */
  {
    id: "july-2026-03",
    date: "2026-07-03",
    jobNo: "",
    haflaId: "28309",
    party: "HAFLA",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 1575,
    amountReceived: 0,
    pendingAmount: 1575,
    status: "Pending",
    items: [
      {
        description: "Buffet Table with Skirting Black Cover",
        quantity: 25
      }
    ],
    remarks: ""
  },


  /* 4 */
  {
    id: "july-2026-04",
    date: "2026-07-03",
    jobNo: "",
    haflaId: "28339",
    party: "HAFLA",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 955,
    amountReceived: 0,
    pendingAmount: 955,
    status: "Pending",
    items: [
      {
        description: "Banquet Chairs",
        quantity: 100
      },
      {
        description: "Buffet Tables",
        quantity: 2
      }
    ],
    remarks: ""
  },


  /* 5 */
  {
    id: "july-2026-05",
    date: "2026-07-03",
    jobNo: "",
    haflaId: "28342",
    party: "HAFLA",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 315,
    amountReceived: 0,
    pendingAmount: 315,
    status: "Pending",
    items: [
      {
        description: "Banquet Chairs",
        quantity: 20
      }
    ],
    remarks: ""
  },


  /* 6 */
  {
    id: "july-2026-06",
    date: "2026-07-04",
    jobNo: "JB0392",
    haflaId: "",
    party: "Ajmal",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Banquet Chairs",
        quantity: 120
      },
      {
        description: "Round Table",
        quantity: 2
      },
      {
        description: "ATHOOR: Podium",
        quantity: 1
      },
      {
        description: "ATHOOR: Square Table",
        quantity: 1
      }
    ],
    remarks: ""
  },


  /* 7 */
  {
    id: "july-2026-07",
    date: "2026-07-04",
    jobNo: "JB0393",
    haflaId: "",
    party: "Allah Baksh",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 1400,
    amountReceived: 1400,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Banquet Chairs",
        quantity: 150
      },
      {
        description: "Round Tables",
        quantity: 15
      }
    ],
    remarks: ""
  },


  /* 8 */
  {
    id: "july-2026-08",
    date: "2026-07-04",
    jobNo: "JB0395",
    haflaId: "",
    party: "Ajmal",
    incharge: "",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Air Cooler",
        quantity: 10
      }
    ],
    remarks: ""
  },


  /* 9 */
  {
    id: "july-2026-09",
    date: "2026-07-04",
    jobNo: "JB0396",
    haflaId: "",
    party: "Spicy Land",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 100,
    amountReceived: 100,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Air Cooler",
        quantity: 1
      }
    ],
    remarks: ""
  },


  /* 10 */
  {
    id: "july-2026-10",
    date: "2026-07-04",
    jobNo: "JB0397",
    haflaId: "",
    party: "Sehr Events (Ajman)",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 286,
    amountReceived: 286,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Crockery & Cutlery",
        quantity: ""
      }
    ],
    remarks: ""
  },


  /* 11 */
  {
    id: "july-2026-11",
    date: "2026-07-06",
    jobNo: "JB0398",
    haflaId: "",
    party: "Private Customer",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 300,
    amountReceived: 300,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Dishes (2 Days)",
        quantity: 5
      }
    ],
    remarks: ""
  },


  /* 12 */
  {
    id: "july-2026-12",
    date: "2026-07-07",
    jobNo: "",
    haflaId: "28338",
    party: "HAFLA",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 1155,
    amountReceived: 0,
    pendingAmount: 1155,
    status: "Pending",
    items: [
      {
        description: "Cooler",
        quantity: 2
      },
      {
        description: "5x5m Tent",
        quantity: 1
      }
    ],
    remarks: ""
  },


  /* 13 */
  {
    id: "july-2026-13",
    date: "2026-07-10",
    jobNo: "JB0399",
    haflaId: "",
    party: "4 Star Event",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Mattress",
        quantity: 45
      }
    ],
    remarks: ""
  },


  /* 14 */
  {
    id: "july-2026-14",
    date: "2026-07-11",
    jobNo: "JB0400",
    haflaId: "",
    party: "BBQ Tonight",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Setup for 55pax",
        quantity: ""
      }
    ],
    remarks: ""
  },


  /* 15 */
  {
    id: "july-2026-15",
    date: "2026-07-11",
    jobNo: "JB0401",
    haflaId: "",
    party: "Private Customer",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 1500,
    amountReceived: 1500,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Single Sofa",
        quantity: 12
      },
      {
        description: "Coffee Table",
        quantity: 3
      },
      {
        description: "Cooler",
        quantity: 2
      },
      {
        description: "Buffet Table",
        quantity: 1
      }
    ],
    remarks: ""
  },


  /* 16 */
  {
    id: "july-2026-16",
    date: "2026-07-12",
    jobNo: "JB0402",
    haflaId: "",
    party: "Private Customer",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 1500,
    amountReceived: 1500,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Air Cooler",
        quantity: 2
      },
      {
        description: "Single Sofa",
        quantity: 12
      },
      {
        description: "Coffee Table",
        quantity: 3
      },
      {
        description: "Barricade",
        quantity: 8
      }
    ],
    remarks: ""
  },


  /* 17 */
  {
    id: "july-2026-17",
    date: "2026-07-12",
    jobNo: "JB0403",
    haflaId: "",
    party: "Shj Events (Usman)",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 60,
    amountReceived: 60,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Banquet Chair",
        quantity: 15
      }
    ],
    remarks: ""
  },


  /* 18 */
  {
    id: "july-2026-18",
    date: "2026-07-13",
    jobNo: "",
    haflaId: "28357",
    party: "HAFLA",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Quincy Chair",
        quantity: 1
      }
    ],
    remarks: ""
  },


  /* 19 */
  {
    id: "july-2026-19",
    date: "2026-07-14",
    jobNo: "JB0404",
    haflaId: "",
    party: "Al Ghous Tents (Usman)",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Canopies",
        quantity: 3
      }
    ],
    remarks: ""
  },


  /* 20 */
  {
    id: "july-2026-20",
    date: "2026-07-15",
    jobNo: "JB0405",
    haflaId: "",
    party: "AG Power & Contracting",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 880,
    amountReceived: 880,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Table Cover",
        quantity: 8
      },
      {
        description: "Table Canopy",
        quantity: 8
      },
      {
        description: "Carpet",
        quantity: 2
      }
    ],
    remarks: "INV-2829"
  },


  /* 21 */
  {
    id: "july-2026-21",
    date: "2026-07-15",
    jobNo: "JB0407",
    haflaId: "",
    party: "Shj Events (Rehan)",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Cooler (from store)",
        quantity: 6
      }
    ],
    remarks: ""
  },


  /* 22 */
  {
    id: "july-2026-22",
    date: "2026-07-16",
    jobNo: "JB0406",
    haflaId: "",
    party: "Best Kidz Nursery",
    incharge: "Saud",
    receivedBy: "Bank",
    paymentMethod: "",
    totalAmount: 420,
    amountReceived: 420,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Banquet Chair",
        quantity: 20
      }
    ],
    remarks: "INV-2830"
  },


  /* 23 */
  {
    id: "july-2026-23",
    date: "2026-07-17",
    jobNo: "JB0408",
    haflaId: "",
    party: "Shj Events (Usman)",
    incharge: "Ali/Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Cooler (x1 Extension)",
        quantity: 2
      }
    ],
    remarks: ""
  },


  /* 24 */
  {
    id: "july-2026-24",
    date: "2026-07-17",
    jobNo: "JB0409",
    haflaId: "",
    party: "Shj Events (Rehan)",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Chafing Dish + Food Pan",
        quantity: 2
      }
    ],
    remarks: ""
  },


  /* 25 */
  {
    id: "july-2026-25",
    date: "2026-07-17",
    jobNo: "JB0410",
    haflaId: "",
    party: "Sama Events (Saddam)",
    incharge: "Saud",
    receivedBy: "Bank",
    paymentMethod: "",
    totalAmount: 400,
    amountReceived: 400,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Setup for 30pax",
        quantity: ""
      }
    ],
    remarks: "35DAAA59F8"
  },


  /* 26 */
  {
    id: "july-2026-26",
    date: "2026-07-18",
    jobNo: "JB0411",
    haflaId: "",
    party: "Private Customer",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 900,
    amountReceived: 900,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Banquet Chairs",
        quantity: 80
      },
      {
        description: "Buffet Table",
        quantity: 10
      }
    ],
    remarks: ""
  },


  /* 27 */
  {
    id: "july-2026-27",
    date: "2026-07-18",
    jobNo: "",
    haflaId: "No ID",
    party: "HAFLA",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Banquet Chairs",
        quantity: 40
      }
    ],
    remarks: "Mehmar will uptae ID"
  },


  /* 28 */
  {
    id: "july-2026-28",
    date: "2026-07-19",
    jobNo: "JB0412",
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
        description: "Banquet Chairs",
        quantity: 25
      }
    ],
    remarks: ""
  },


  /* 29 */
  {
    id: "july-2026-29",
    date: "2026-07-19",
    jobNo: "",
    haflaId: "28375",
    party: "HAFLA",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Banquet Chairs",
        quantity: 12
      },
      {
        description: "Square Tables",
        quantity: 4
      }
    ],
    remarks: ""
  },


  /* 30 */
  {
    id: "july-2026-30",
    date: "2026-07-19",
    jobNo: "",
    haflaId: "28371",
    party: "HAFLA",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Banquet Chairs",
        quantity: 80
      },
      {
        description: "Square Tables",
        quantity: 40
      }
    ],
    remarks: ""
  },


  /* 31 */
  {
    id: "july-2026-31",
    date: "2026-07-21",
    jobNo: "JB0413",
    haflaId: "",
    party: "Private Customer",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 600,
    amountReceived: 600,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Banquet Chairs",
        quantity: 70
      }
    ],
    remarks: ""
  },


  /* 32 */
  {
    id: "july-2026-32",
    date: "2026-07-24",
    jobNo: "JB0414",
    haflaId: "",
    party: "Event Sugi",
    incharge: "Saud",
    receivedBy: "Zohaib",
    paymentMethod: "",
    totalAmount: 350,
    amountReceived: 350,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Banquet Chair",
        quantity: 16
      },
      {
        description: "Buffet Table",
        quantity: 4
      }
    ],
    remarks: ""
  },


  /* 33 */
  {
    id: "july-2026-33",
    date: "2026-07-25",
    jobNo: "JB0415",
    haflaId: "",
    party: "Allah Baksh",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 4000,
    amountReceived: 4000,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Banquet Chair",
        quantity: 570
      },
      {
        description: "Round Table",
        quantity: 57
      }
    ],
    remarks: ""
  },


  /* 34 */
  {
    id: "july-2026-34",
    date: "2026-07-25",
    jobNo: "JB0416",
    haflaId: "",
    party: "Private Customer",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 1500,
    amountReceived: 1500,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Sofa",
        quantity: 10
      },
      {
        description: "Coffee Table",
        quantity: 3
      },
      {
        description: "Cooler",
        quantity: 2
      }
    ],
    remarks:
      "Received 3000.00 for JB0417, JB0420. Transferred 2500 to Bank"
  },


  /* 35 */
  {
    id: "july-2026-35",
    date: "2026-07-26",
    jobNo: "JB0417",
    haflaId: "",
    party: "Memon Darbar",
    incharge: "Saud",
    receivedBy: "Saud",
    paymentMethod: "",
    totalAmount: 1300,
    amountReceived: 1300,
    pendingAmount: 0,
    status: "Received",
    items: [
      {
        description: "Dinner Plate",
        quantity: 200
      },
      {
        description: "Small Plate",
        quantity: 200
      },
      {
        description: "Fork & Spoon",
        quantity: 200
      },
      {
        description: "Chafing Dish",
        quantity: 8
      }
    ],
    remarks: ""
  },


  /* 36 */
  {
    id: "july-2026-36",
    date: "2026-07-27",
    jobNo: "JB0418",
    haflaId: "",
    party: "Ismail",
    incharge: "Saud",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Green Carpet",
        quantity: ""
      }
    ],
    remarks: ""
  },


  /* 37 */
  {
    id: "july-2026-37",
    date: "2026-07-27",
    jobNo: "",
    haflaId: "28391",
    party: "HAFLA",
    incharge: "Ihsan",
    receivedBy: "",
    paymentMethod: "",
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    status: "No Amount",
    items: [
      {
        description: "Scandinavian Chairs",
        quantity: 45
      }
    ],
    remarks: ""
  }

];


/* =====================================================
   IMPORT JULY 2026 ORDERS
   IMPORTS ONLY ONCE
===================================================== */

function importJuly2026Orders() {

  /*
    Check the import flag first.
    This prevents duplicate orders when
    the page is refreshed.
  */

  const alreadyImported =
    localStorage.getItem(
      JULY_IMPORT_KEY
    );


  if (alreadyImported === "yes") {
    return;
  }


  let added = 0;


  JULY_2026_ORDERS.forEach(newOrder => {

    const exists =
      orders.some(
        existing =>
          existing.id === newOrder.id
      );


    if (!exists) {

      orders.push({
        ...newOrder
      });

      added++;

    }

  });


  sortOrders();

  save();


  localStorage.setItem(
    JULY_IMPORT_KEY,
    "yes"
  );


  if (added > 0) {

    console.log(
      `July 2026 import completed: ${added} orders added.`
    );

  }

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

function addItem(
  description = "",
  quantity = ""
) {

  const row =
    document.createElement("div");

  row.className =
    "item-row";


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


  row.querySelector(
    ".remove-item"
  ).onclick = () =>
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
    .forEach(element => {

      element.classList.toggle(
        "active",
        element.id === section
      );

    });


  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.section === section
      );

    });


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
    names[section] || "";


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
      totalAmount: total,
      amountReceived: received
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


  const index =
    orders.findIndex(
      order =>
        order.id === obj.id
    );


  if (index >= 0) {

    orders[index] =
      obj;

  } else {

    orders.push(obj);

  }


  sortOrders();

  save();


  toast(
    index >= 0
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
          order.status ===
            "Pending" ||
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
   REPORT BUTTONS
===================================================== */

$("reportMonth").value =
  currentMonth();


$("generateReportBtn").onclick =
  renderReport;


/* =====================================================
   PRINT REPORT
   Opens a clean print window containing ONLY
   the currently generated monthly report.
===================================================== */

$("printReportBtn").onclick = () => {

  // Make sure the latest selected month is rendered
  renderReport();

  const report =
    $("reportPreview").innerHTML;

  if (!report || !report.trim()) {

    toast("Please generate the report first.");

    return;

  }

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=1200,height=800"
    );


  if (!printWindow) {

    alert(
      "Printing was blocked by your browser. Please allow pop-ups for this site."
    );

    return;

  }


  printWindow.document.open();

  printWindow.document.write(`

    <!DOCTYPE html>

    <html>

    <head>

      <meta charset="UTF-8">

      <title>
        AL JEFOON TENTS - Monthly Report
      </title>


      <style>

        * {
          box-sizing: border-box;
        }


        body {

          margin: 0;

          padding: 25px;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          background: white;

          color: #111;

        }


        .report-header {

          display: flex;

          justify-content: space-between;

          align-items: flex-start;

          margin-bottom: 25px;

          border-bottom: 2px solid #000;

          padding-bottom: 15px;

        }


        .report-header h2 {

          margin: 0 0 5px 0;

          font-size: 24px;

        }


        .report-header p {

          margin: 0;

          font-size: 13px;

        }


        .report-title {

          text-align: right;

        }


        .report-title strong {

          display: block;

          font-size: 18px;

        }


        .report-title span {

          display: block;

          margin-top: 5px;

          font-size: 11px;

          color: #666;

        }


        .report-summary {

          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 12px;

          margin-bottom: 25px;

        }


        .report-box {

          border: 1px solid #ccc;

          padding: 12px;

          text-align: center;

        }


        .report-box span {

          display: block;

          font-size: 11px;

          margin-bottom: 5px;

          color: #555;

        }


        .report-box strong {

          font-size: 18px;

        }


        .table-wrap {

          width: 100%;

        }


        table {

          width: 100%;

          border-collapse: collapse;

          font-size: 10px;

        }


        th {

          background: #f2f2f2;

          font-weight: bold;

        }


        th,
        td {

          border: 1px solid #999;

          padding: 6px;

          text-align: left;

          vertical-align: top;

        }


        .badge {

          display: inline-block;

          padding: 3px 7px;

          border-radius: 4px;

          font-size: 9px;

          font-weight: bold;

          border: 1px solid #999;

          background: white;

          color: black;

        }


        .empty {

          text-align: center;

          padding: 20px;

        }


        @page {

          size: A4 landscape;

          margin: 10mm;

        }


        @media print {

          body {

            padding: 0;

          }

        }

      </style>

    </head>


    <body>

      ${report}

    </body>


    </html>

  `);

  printWindow.document.close();


  printWindow.focus();


  setTimeout(() => {

    printWindow.print();

    printWindow.close();

  }, 500);

};


/* =====================================================
   ALL ORDERS
===================================================== */

function renderOrders() {

  sortOrders();


  const query =
    $("searchOrders")
      .value
      .toLowerCase()
      .trim();


  const month =
    $("filterMonth").value;


  const selectedStatus =
    $("filterStatus").value;


  const filteredOrders =
    orders.filter(order => {

      const searchableText = [

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


      const matchesSearch =
        !query ||
        searchableText.includes(
          query
        );


      const matchesMonth =
        !month ||
        (
          order.date &&
          order.date.startsWith(
            month
          )
        );


      const matchesStatus =
        !selectedStatus ||
        order.status ===
          selectedStatus;


      return (
        matchesSearch &&
        matchesMonth &&
        matchesStatus
      );

    });


  $("ordersBody")
    .innerHTML =

      filteredOrders.length

        ? filteredOrders
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
                  || "—";


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
                      onclick="editOrder('${esc(
                        order.id
                      )}')"
                    >
                      Edit
                    </button>

                    <button
                      class="action-btn"
                      onclick="deleteOrder('${esc(
                        order.id
                      )}')"
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
   FILTER EVENTS
===================================================== */

$("searchOrders").oninput =
  renderOrders;

$("filterMonth").oninput =
  renderOrders;

$("filterStatus").onchange =
  renderOrders;


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
    order.date || todayISO();


  $("jobNo").value =
    order.jobNo || "";


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


  let currentStatus =
    order.status;


  /* Convert old status names */

  if (
    currentStatus === "Paid"
  ) {
    currentStatus =
      "Received";
  }


  if (
    currentStatus ===
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
    order.items &&
    order.items.length
      ? order.items
      : [{}]
  ).forEach(item => {

    addItem(
      item.description || "",
      item.quantity || ""
    );

  });


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
      `Delete ${order.jobNo || order.party}? This cannot be undone.`
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
                              || "—"
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

  let toastElement =
    document.querySelector(
      ".toast"
    );


  if (!toastElement) {

    toastElement =
      document.createElement(
        "div"
      );

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
   CONVERT OLD STATUS VALUES
   Protect existing data
===================================================== */

let dataChanged = false;


orders.forEach(order => {

  if (
    order.status === "Paid"
  ) {

    order.status =
      "Received";

    dataChanged = true;

  }


  if (
    order.status ===
    "Partially Paid"
  ) {

    order.status =
      "Partially Received";

    dataChanged = true;

  }

});


/* =====================================================
   RE-CALCULATE OLD ORDER STATUSES
===================================================== */

orders.forEach(order => {

  const calculated =
    statusFor(order);


  if (
    order.status === "Paid" ||
    order.status === "Partially Paid"
  ) {

    order.status =
      calculated;

    dataChanged = true;

  }

});


if (dataChanged) {
  save();
}


/* =====================================================
   IMPORT JULY 2026 DATA
   MUST RUN BEFORE INITIALIZATION
===================================================== */

importJuly2026Orders();


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

/* =====================================================
   INITIAL GOOGLE DRIVE BACKUP
===================================================== */

setTimeout(
  () => backupToGoogleDrive(),
  1500
);
