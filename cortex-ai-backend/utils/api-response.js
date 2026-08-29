/** Standardized success response. */
const successResponse = (res, { statusCode = 200, message = 'Success', data = null }) =>
  res.status(statusCode).json({ success: true, message, data });

/** Standardized error response. */
const errorResponse = (res, { statusCode = 500, message = 'Internal Server Error', details = null }) => {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
};

module.exports = { successResponse, errorResponse };