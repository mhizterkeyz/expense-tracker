if (!localStorage.getItem("authData")) {
  window.location = "/";
}

const authData = JSON.parse(localStorage.authData);
const form = document.getElementsByTagName("form")[0];

form.addEventListener("submit", (ev) => {
  ev.preventDefault();

  const formData = new FormData(form);
  const formDataJson = {};
  for (const [key, value] of formData.entries()) {
    formDataJson[key] = value;
  }

  fetch("/api/labels", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authData.token}`,
    },
    method: "POST",
    body: JSON.stringify(formDataJson),
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
        window.location = "/home";
      }
    })
    .catch(console.log);
});
