const path = require("path");
const { readData } = require("../utils/fileStore");
const { findUserById, sanitizeUser } = require("../services/userService");

const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || "./data");
const tokensPath = path.join(dataDir, "tokens.json");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const token = authHeader.slice(7).trim();
  const tokens = await readData(tokensPath, []);
  const tokenRecord = tokens.find((item) => item.token === token);

  if (!tokenRecord) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }

  const user = await findUserById(tokenRecord.userId);
  if (!user) {
    return res.status(401).json({ message: "User not found." });
  }

  req.user = sanitizeUser(user);
  req.token = token;
  return next();
}

module.exports = { authMiddleware, tokensPath };
