const express = require("express");
const router = express.Router();
const controller = require("../controllers/pollController");

router.get("/", controller.getAllPolls);
router.get("/:id", controller.getPollById);
router.post("/", controller.createPoll);
router.post("/:id/vote", controller.vote);
router.put("/: id", controller.updatePoll);
router.delete("/:id", controller.deletePoll);

module.exports = router;