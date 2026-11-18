import * as authService from './auth.service.js';
import { validateRegister, validateLogin } from './auth.validation.js';

// Registers a new user account
export async function register(req, res) {
  const validatedBody = validateRegister(req.body);
  const user = await authService.register(validatedBody);
  res.status(201).json({
    success: true,
    data: user,
  });
}

// Logs in an existing user
export async function login(req, res) {
  const validatedBody = validateLogin(req.body);
  const authData = await authService.login(validatedBody);
  res.status(200).json({
    success: true,
    data: authData,
  });
}

// Retrieves profile of the currently authenticated user
export async function me(req, res) {
  const user = authService.getCurrentUser(req.user);
  res.status(200).json({
    success: true,
    data: user,
  });
}
