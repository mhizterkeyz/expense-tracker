if (!localStorage.getItem("authData")) {
  window.location = "/";
}

const authData = JSON.parse(localStorage.authData);
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");

const loadData = (startDate, endDate) => {
  const chartBoard = document.querySelector(".chart-board");
  const totalDisplay = document.querySelector("#total");

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

        totalDisplay.innerHTML = `Total: ₦ ${(+data.total.toFixed(
          2
        )).toLocaleString()}`;

        chartBoard.innerHTML = "";
        Object.values(data.labels).forEach((item) => {
          chartBoard.innerHTML += `<div style="position: relative" class="chart">
    <div class="chart-label">${item.name}:</div>
    <div class="chart-bar" style="width: ${
      (item.value / base) * 100
    }%;display: flex;align-items: center;justify-content: center;color: #000;"><span style="display: flex;align-items: center;justify-content: center;position: absolute;width: 100%;height: 100%;left: 0;top: 0;">₦ ${(+item.value.toFixed(
            2
          )).toLocaleString()}</span></div>
  </div>`;
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
