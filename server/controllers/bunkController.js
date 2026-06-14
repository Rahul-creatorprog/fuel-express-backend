const Bunk = require("../models/Bunk");

const getBunks = async (req, res) => {
  try {
    const bunks = await Bunk.find();
    res.json(bunks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createBunk = async (req, res) => {
  try {
    const { name, address, latitude, longitude, fuels } = req.body;

    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing required fields for Bunk creation" });
    }

    const bunk = new Bunk({
      name,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      fuels: fuels || ["Petrol", "Diesel", "EV Charging"]
    });

    await bunk.save();

    res.status(201).json({ message: "Bunk created successfully", bunk });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteBunk = async (req, res) => {
  try {
    const { id } = req.params;
    const bunk = await Bunk.findByIdAndDelete(id);

    if (!bunk) {
      return res.status(404).json({ error: "Bunk not found" });
    }

    res.json({ message: "Bunk deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getBunks,
  createBunk,
  deleteBunk
};
