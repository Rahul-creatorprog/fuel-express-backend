import React, { useState } from "react";

function Order() {
  const [order, setOrder] = useState({
    fuelType: "",
    quantity: "",
    address: "",
    phone: ""
  });

  const handleChange = (e) => {
    setOrder({ ...order, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/api/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(order)
    });

    const data = await response.json();
    alert(data.message);
  };

  return (
    <div>
      <h2>Fuel Delivery Order</h2>

      <form onSubmit={handleSubmit}>
        <select name="fuelType" onChange={handleChange}>
          <option value="">Select Fuel Type</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
        </select>

        <input
          name="quantity"
          placeholder="Liters"
          onChange={handleChange}
        />

        <input
          name="address"
          placeholder="Delivery Address"
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Phone Number"
          onChange={handleChange}
        />

        <button type="submit">Place Order</button>
      </form>
    </div>
  );
}

export default Order;