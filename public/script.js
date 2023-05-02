if (localStorage.getItem("authData")) {
  window.location = "/home";
}

const form = document.getElementsByTagName("form")[0];

form.addEventListener("submit", (ev) => {
  ev.preventDefault();

  const formData = new FormData(form);
  const formDataJson = {};
  for (const [key, value] of formData.entries()) {
    formDataJson[key] = value;
  }

  fetch("/api/login", {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify(formDataJson),
  })
    .then((response) => response.json())
    .then(({ data }) => {
      localStorage.setItem("authData", JSON.stringify(data, null, 2));
      window.location = "/home";
    })
    .catch(console.log);
});
