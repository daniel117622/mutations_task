// validationUtils.js

// Define an enum for error codes
const ErrorCode = {
    NO_ERROR: 0,
    MISSING_DNA: 1,
    EXTRA_FIELDS: 2,
};

// Utility function for validation
function validateDnaRequest(req) {
    if (!req.body.dna) {
        return ErrorCode.MISSING_DNA;
    }
    if (Object.keys(req.body).length !== 1) {
        return ErrorCode.EXTRA_FIELDS;
    }
    return ErrorCode.NO_ERROR;
}

// Export the function and the enum
module.exports = { validateDnaRequest, ErrorCode };