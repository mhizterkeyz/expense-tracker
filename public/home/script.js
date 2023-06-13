if (!localStorage.getItem("authData")) {
  window.location = "/";
}

const authData = JSON.parse(localStorage.authData);
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");

const formatNumber = (number) => {
  return (+number.toFixed(2)).toLocaleString();
};

const loadData = (startDate, endDate) => {
  const chartBoard = document.querySelector(".chart-board");
  const cardsDisplay = document.querySelector(".cards");

  fetch(`/api/labels?start_date=${startDate}&end_date=${endDate}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authData.token}`,
    },
  })
    .then((res) => {
      if (res.status === 401) {
        delete localStorage.authData;
        window.location = "/";
        return null;
      }
      return res.json();
    })
    .then((res) => {
      if (res) {
        const { data } = res;
        const base = Math.max(
          1,
          ...Object.values(data.labels).map((item) => item.value)
        );
        const cards = [
          {
            name: "Period Total",
            value: `₦ ${formatNumber(data.periodTotal)}`,
          },
          {
            name: "Period Max",
            value: `₦ ${formatNumber(data.periodMax.value)} (${
              data.periodMax.name
            })`,
          },
          {
            name: "Period Min",
            value: `₦ ${formatNumber(data.periodMin.value)} (${
              data.periodMin.name
            })`,
          },
          {
            name: "This Month Total",
            value: `₦ ${formatNumber(data.thisMonthTotal)}`,
          },
          {
            name: "This Month Max",
            value: `₦ ${formatNumber(data.thisMonthMax.value)} (${
              data.thisMonthMax.name
            })`,
          },
          {
            name: "This Month Min",
            value: `₦ ${formatNumber(data.thisMonthMin.value)} (${
              data.thisMonthMin.name
            })`,
          },
          {
            name: "Last Month Total",
            value: `₦ ${formatNumber(data.lastMonthTotal)}`,
          },
          {
            name: "Last Month Max",
            value: `₦ ${formatNumber(data.lastMonthMax.value)} (${
              data.lastMonthMax.name
            })`,
          },
          {
            name: "Last Month Min",
            value: `₦ ${formatNumber(data.lastMonthMin.value)} (${
              data.lastMonthMin.name
            })`,
          },
          {
            name: "3 Months Ago Total",
            value: `₦ ${formatNumber(data.threeMonthsAgoTotal)}`,
          },
          {
            name: "3 Months Ago Max",
            value: `₦ ${formatNumber(data.threeMonthsAgoMax.value)} (${
              data.threeMonthsAgoMax.name
            })`,
          },
          {
            name: "3 Months Ago Min",
            value: `₦ ${formatNumber(data.threeMonthsAgoMin.value)} (${
              data.lastMonthMin.name
            })`,
          },
        ];

        chartBoard.innerHTML = "";
        cardsDisplay.innerHTML = "";

        Object.values(data.labels)
          .sort((a, b) => b.value - a.value)
          .forEach((item) => {
            chartBoard.innerHTML += `<div style="position: relative" class="chart">
    <div class="chart-bar" style="width: ${
      (item.value / base) * 100
    }%;display: flex;align-items: center;justify-content: center;color: #000;"><span style="display: flex;align-items: center;justify-content: center;position: absolute;width: 100%;height: 100%;left: 0;top: 0;">₦ ${formatNumber(
              item.value
            )} (${item.name})</span></div>
  </div>`;
          });

        cards.forEach((card) => {
          cardsDisplay.innerHTML += `
          <p>
            ${card.name}: ${card.value}
          <p>
          `;
        });
      }
    })
    .catch(console.log);
};

loadData();

[endDateInput, startDateInput].forEach((input) => {
  input.addEventListener("change", () => {
    loadData(startDateInput.value, endDateInput.value);
  });
});
