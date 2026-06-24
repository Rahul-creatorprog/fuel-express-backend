const handleSubmit = async (e) => {
  e.preventDefault();

  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(form)
  });

  const data = await response.json();

  if (data.message === "Login Successful") {
    window.location.href = "/order";
  } else {
    alert(data.message);
  }
};