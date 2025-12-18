const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../data/polls.json");

const readData = () => {
  try {
    const data = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeData = (data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

exports.getAllPolls = (req, res) => {
  const polls = readData();
  const { status, category } = req.query;

  let filtered = polls;
  if (status === "active") {
    filtered = filtered.filter((p) => p.isActive);
  } else if (status === "closed") {
    filtered = filtered.filter((p) => !p.isActive);
  }
  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }

  res.json(filtered);
};

exports.getPollById = (req, res) => {
  const polls = readData();
  const poll = polls.find((p) => p.id === parseInt(req.params.id));
  if (!poll) return res.status(404).json({ error: "Опрос не найден" });
  res.json(poll);
};

exports.createPoll = (req, res) => {
  const { question, options, category } = req.body;

  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      error: "Необходим вопрос и минимум 2 варианта ответа",
    });
  }

  const polls = readData();
  const newPoll = {
    id: polls.length > 0 ? Math.max(...polls.map((p) => p.id)) + 1 : 1,
    question,
    category: category || "",
    options: options.map((opt, index) => ({
      id: index + 1,
      text: opt,
      votes: 0,
    })),
    totalVotes: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  polls.push(newPoll);
  writeData(polls);
  res.status(201).json(newPoll);
};

exports.vote = (req, res) => {
  const polls = readData();
  const pollIndex = polls.findIndex((p) => p.id === parseInt(req.params.id));

  if (pollIndex === -1) {
    return res.status(404).json({ error: "Опрос не найден" });
  }

  const poll = polls[pollIndex];

  if (!poll.isActive) {
    return res.status(400).json({ error: "Опрос закрыт для голосования" });
  }

  const { optionId } = req.body;
  const optionIndex = poll.options.findIndex((o) => o.id === parseInt(optionId));

  if (optionIndex === -1) {
    return res.status(400).json({ error: "Вариант ответа не найден" });
  }

  poll.options[optionIndex].votes += 1;
  poll.totalVotes += 1;
  poll.updatedAt = new Date().toISOString();

  polls[pollIndex] = poll;
  writeData(polls);

  res.json(poll);
};

exports.updatePoll = (req, res) => {
  const polls = readData();
  const index = polls.findIndex((p) => p.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: "Опрос не найден" });
  }

  const { question, category, isActive } = req.body;

  polls[index] = {
    ...polls[index],
    question: question ?? polls[index].question,
    category: category ?? polls[index].category,
    isActive: isActive ?? polls[index].isActive,
    updatedAt: new Date().toISOString(),
  };

  writeData(polls);
  res.json(polls[index]);
};

exports.deletePoll = (req, res) => {
  const polls = readData();
  const index = polls.findIndex((p) => p.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: "Опрос не найден" });
  }

  const deleted = polls.splice(index, 1);
  writeData(polls);
  res.json({ message: "Опрос удалён", poll: deleted[0] });
};
