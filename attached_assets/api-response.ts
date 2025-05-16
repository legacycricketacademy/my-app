export function sendSuccess(res, message, data = {}) {
  return res.status(200).json({ success: true, message, data });
}

export function sendError(res, message = 'An error occurred', code = 500) {
  return res.status(code).json({ success: false, message });
}

export function sendValidationError(res, message, fields = []) {
  return res.status(400).json({ success: false, message, error: 'InvalidInputFormat', fields });
}

export function sendUsernameExistsError(res, username) {
  return res.status(409).json({
    success: false,
    message: `The username '${username}' is already taken.`,
    error: 'UsernameAlreadyExists'
  });
}

export function sendEmailExistsError(res, email) {
  return res.status(409).json({
    success: false,
    message: `The email '${email}' is already registered.`,
    error: 'EmailAlreadyRegistered'
  });
}