// Kept separate from image.ts (which pulls in sharp) so the edge-runtime proxy can
// import just these numbers without dragging a native Node.js dependency along with them.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Multipart form fields (category, description, coordinates) add a little on top of the
// photo itself, so the raw request is allowed a bit more than the photo's own limit.
export const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;
