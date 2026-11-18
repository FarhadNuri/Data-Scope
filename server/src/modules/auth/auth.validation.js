import { HttpError } from '../../utils/http-error.js';
import { isNonEmptyString, isValidEmail } from '../../utils/validate.js';

// Validates registration payload
export function validateRegister(body) {
  const details = [];

  if (!isNonEmptyString(body.name, 100)) {
    details.push({
      field: 'name',
      message: 'name is required and must be between 1 and 100 characters',
    });
  }

  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(rawEmail)) {
    details.push({
      field: 'email',
      message: 'email must be a valid email address',
    });
  }

  const password = typeof body.password === 'string' ? body.password : '';
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (password.length < 8 || password.length > 64 || !hasLetter || !hasNumber) {
    details.push({
      field: 'password',
      message: 'password must be between 8 and 64 characters and contain at least one letter and one number',
    });
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    name: body.name.trim(),
    email: rawEmail,
    password,
  };
}

// Validates login payload
export function validateLogin(body) {
  const details = [];

  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(rawEmail)) {
    details.push({
      field: 'email',
      message: 'email must be a valid email address',
    });
  }

  if (typeof body.password !== 'string' || body.password === '') {
    details.push({
      field: 'password',
      message: 'password is required',
    });
  }

  if (details.length > 0) {
    throw new HttpError(400, 'Validation failed', details);
  }

  return {
    email: rawEmail,
    password: body.password,
  };
}
