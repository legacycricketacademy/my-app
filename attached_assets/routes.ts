import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUsernameExistsError,
  sendEmailExistsError
} from './api-response';

app.post("/api/register", async (req, res) => {
  try {
    const { username, password, email, fullName, role, phone } = req.body;

    if (!username || !password || !email || !fullName || !role) {
      return sendValidationError(res, 'Missing required fields', ['username', 'email', 'password', 'fullName', 'role']);
    }

    const existingUser = await storage.getUserByUsernameInAcademy(username, 1);
    if (existingUser) return sendUsernameExistsError(res, username);

    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) return sendEmailExistsError(res, email);

    const userId = await storage.createUser({ username, email, password, fullName, role, phone, academyId: 1 });

    return sendSuccess(res, 'Registration successful! Please verify your email.', { userId });
  } catch (err) {
    console.error('Registration failed:', err);
    return sendError(res, 'Internal server error');
  }
});