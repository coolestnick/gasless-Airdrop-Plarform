const Joi = require('joi');
const { ethers } = require('ethers');

// Ethereum address validator
const ethereumAddress = Joi.string().custom((value, helpers) => {
  if (!ethers.isAddress(value)) {
    return helpers.error('any.invalid');
  }
  return value.toLowerCase();
}, 'Ethereum Address Validation');

// Validation schemas
const schemas = {
  checkEligibility: Joi.object({
    walletAddress: ethereumAddress.required()
  }),

  claim: Joi.object({
    walletAddress: ethereumAddress.required(),
    signature: Joi.string().required().min(100),
    captchaToken: Joi.string().required()
  }),

  claimStatus: Joi.object({
    address: ethereumAddress.required()
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const data = { ...req.body, ...req.params, ...req.query };
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Replace request data with validated data
    req.validatedData = value;
    next();
  };
};

module.exports = {
  validate,
  schemas
};
