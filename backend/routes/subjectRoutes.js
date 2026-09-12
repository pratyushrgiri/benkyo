const express = require("express");
const {
  getSubjects,
  addSubject,
  removeSubject,
} = require("../controllers/subjectController");

const router = express.Router();

router.get("/", getSubjects);
router.post("/", addSubject);
router.delete("/:id", removeSubject);

module.exports = router;
