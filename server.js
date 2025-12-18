const express = require("express");
const path = require("path");
const pollRoutes = require("./src/routes/polls");
const logger = require("./src/middleware/logger");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended:  true }));
app.use(logger);

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/polls", pollRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

app.listen(PORT, () => {
  console.log(`Сервер "Голосование за вариант" запущен:  http://localhost:${PORT}`);
});