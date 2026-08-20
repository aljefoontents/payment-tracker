/* =====================================================
   MONTHLY REPORT
   FIXED:
   - Total Received is calculated for selected month only
   - Total Pending is calculated for selected month only
   - Pending Orders is calculated for selected month only
   - Received amount is taken from amountReceived
   - Falls back to Total - Pending if needed
===================================================== */

function renderReport() {

  const month =
    $("reportMonth").value ||
    currentMonth();


  $("reportMonth").value =
    month;


  /* ONLY ORDERS FROM SELECTED MONTH */
  const arr =
    orders.filter(order =>
      order.date &&
      order.date.slice(0, 7) === month
    );


  /* =====================================================
     TOTAL RECEIVED
  ===================================================== */

  const received =
    arr.reduce(
      (sum, order) => {

        const total =
          Number(order.totalAmount || 0);

        const pending =
          Number(order.pendingAmount || 0);

        let amountReceived =
          Number(order.amountReceived);


        /*
          If amountReceived is missing or invalid,
          calculate it from Total - Pending.
        */

        if (
          !Number.isFinite(amountReceived)
        ) {

          amountReceived =
            Math.max(
              0,
              total - pending
            );

        }


        return sum + amountReceived;

      },
      0
    );


  /* =====================================================
     TOTAL PENDING
  ===================================================== */

  const pending =
    arr.reduce(
      (sum, order) =>
        sum +
        Math.max(
          0,
          Number(order.pendingAmount || 0)
        ),
      0
    );


  /* =====================================================
     PENDING ORDERS
     Includes Pending + Partially Received
  ===================================================== */

  const pendingOrders =
    arr.filter(order => {

      const total =
        Number(order.totalAmount || 0);

      const receivedAmount =
        Number(
          order.amountReceived || 0
        );

      const pendingAmount =
        Math.max(
          0,
          total - receivedAmount
        );


      return (
        pendingAmount > 0 &&
        total > 0
      );

    }).length;


  /* =====================================================
     MONTH LABEL
  ===================================================== */

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


  /* =====================================================
     REPORT
  ===================================================== */

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
            ${pendingOrders}
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

                        const total =
                          Number(
                            order.totalAmount || 0
                          );

                        const pendingAmount =
                          Math.max(
                            0,
                            Number(
                              order.pendingAmount || 0
                            )
                          );

                        let receivedAmount =
                          Number(
                            order.amountReceived
                          );


                        if (
                          !Number.isFinite(
                            receivedAmount
                          )
                        ) {

                          receivedAmount =
                            Math.max(
                              0,
                              total -
                              pendingAmount
                            );

                        }


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
                                receivedAmount
                              )}
                            </td>

                            <td>
                              ${money(
                                pendingAmount
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


      <!-- PRINT TOTALS -->

      <div
        style="
          margin-top:20px;
          padding:15px;
          border-top:2px solid #222;
          border-bottom:1px solid #ccc;
          display:flex;
          justify-content:flex-end;
          gap:40px;
          font-size:13px;
        "
      >

        <div>

          <strong>
            Total Received:
          </strong>

          ${money(received)}

        </div>


        <div>

          <strong>
            Total Pending:
          </strong>

          ${money(pending)}

        </div>


        <div>

          <strong>
            Pending Orders:
          </strong>

          ${pendingOrders}

        </div>

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
