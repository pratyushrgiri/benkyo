function isValidEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }

  if (email.includes(' ')) {
    return false;
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) {
    return false;
  }

  if (!domainPart.includes('.')) {
    return false;
  }

  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return false;
  }

  return true;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return fallback;
  }
  return num;
}

function toBoundedNumber(value, min, max, fallback) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, num));
}

module.exports = {
  isValidEmail,
  isNonEmptyString,
  toPositiveInt,
  toBoundedNumber,
};
