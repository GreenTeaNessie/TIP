const fs = require('fs');
const path = require('path');

const votesFilePath = path.join(__dirname, '..', 'data', 'votes.json');

/**
 * Чтение голосов из файла
 */
function readVotes() {
  try {
    const data = fs.readFileSync(votesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка чтения votes.json:', error);
    return { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  }
}

/**
 * Запись голосов в файл
 */
function writeVotes(votes) {
  try {
    fs.writeFileSync(votesFilePath, JSON.stringify(votes, null, 2), 'utf8');
  } catch (error) {
    console.error('Ошибка записи votes.json:', error);
  }
}

/**
 * GET /api/votes - Получить все голоса
 * Query параметр: format=percent для получения процентов
 */
function getAllVotes(req, res) {
  const votes = readVotes();
  
  if (req.query.format === 'percent') {
    const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0);
    const percentVotes = {};
    
    for (const [id, count] of Object.entries(votes)) {
      percentVotes[id] = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : '0.0';
    }
    
    return res.json({
      votes: percentVotes,
      total: totalVotes,
      format: 'percent'
    });
  }
  
  const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0);
  res.json({
    votes,
    total: totalVotes
  });
}

/**
 * GET /api/votes/:id - Получить голоса по конкретному варианту
 */
function getVoteById(req, res) {
  const votes = readVotes();
  const id = req.params.id;
  
  if (!votes.hasOwnProperty(id) || id < '1' || id > '5') {
    return res.status(404).json({ 
      error: 'Вариант не найден. Допустимые значения: 1-5' 
    });
  }
  
  res.json({
    optionId: id,
    count: votes[id]
  });
}

/**
 * POST /api/votes - Добавить голос
 * Body: { "optionId": "1-5" }
 */
function addVote(req, res) {
  const { optionId } = req.body;
  
  if (!optionId || !['1', '2', '3', '4', '5'].includes(String(optionId))) {
    return res.status(400).json({ 
      error: 'Неверный optionId. Допустимые значения: 1-5' 
    });
  }
  
  const votes = readVotes();
  votes[String(optionId)] = (votes[String(optionId)] || 0) + 1;
  writeVotes(votes);
  
  res.json({
    success: true,
    optionId: String(optionId),
    newCount: votes[String(optionId)]
  });
}

/**
 * DELETE /api/votes - Сбросить все голоса
 */
function resetVotes(req, res) {
  const emptyVotes = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0
  };
  
  writeVotes(emptyVotes);
  
  res.json({
    success: true,
    message: 'Все голоса сброшены'
  });
}

module.exports = {
  getAllVotes,
  getVoteById,
  addVote,
  resetVotes
};
