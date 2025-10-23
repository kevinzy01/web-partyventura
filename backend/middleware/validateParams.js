/**
 * Middleware para validar y sanitizar query parameters
 * Previene ataques de DoS por parámetros excesivos
 */

/**
 * Valida y limita el parámetro 'limit' en queries de paginación
 */
const validateLimit = (defaultLimit = 50, maxLimit = 100) => {
  return (req, res, next) => {
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      
      if (isNaN(limit) || limit < 1) {
        return res.status(400).json({
          success: false,
          message: 'El parámetro limit debe ser un número positivo',
          errorCode: 'INVALID_LIMIT'
        });
      }
      
      // Limitar al máximo permitido
      req.query.limit = Math.min(limit, maxLimit);
    } else {
      req.query.limit = defaultLimit;
    }
    
    next();
  };
};

/**
 * Valida el parámetro 'page' en queries de paginación
 */
const validatePage = (req, res, next) => {
  if (req.query.page) {
    const page = parseInt(req.query.page);
    
    if (isNaN(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro page debe ser un número positivo',
        errorCode: 'INVALID_PAGE'
      });
    }
    
    req.query.page = page;
  } else {
    req.query.page = 1;
  }
  
  next();
};

/**
 * Valida parámetros de fecha
 */
const validateDateParams = (...dateParams) => {
  return (req, res, next) => {
    const invalidDates = [];
    
    for (const paramName of dateParams) {
      const dateValue = req.query[paramName] || req.body[paramName];
      
      if (dateValue) {
        const date = new Date(dateValue);
        
        if (isNaN(date.getTime())) {
          invalidDates.push(paramName);
        }
      }
    }
    
    if (invalidDates.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Fechas inválidas: ${invalidDates.join(', ')}`,
        errorCode: 'INVALID_DATE_FORMAT',
        invalidDates
      });
    }
    
    next();
  };
};

/**
 * Valida que una fecha de inicio sea anterior a una fecha de fin
 */
const validateDateRange = (startParam = 'startDate', endParam = 'endDate') => {
  return (req, res, next) => {
    const source = req.query[startParam] ? req.query : req.body;
    const startDate = source[startParam];
    const endDate = source[endParam];
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: `${endParam} debe ser posterior a ${startParam}`,
          errorCode: 'INVALID_DATE_RANGE'
        });
      }
    }
    
    next();
  };
};

/**
 * Valida parámetros enum
 */
const validateEnum = (paramName, allowedValues, isRequired = false) => {
  return (req, res, next) => {
    const value = req.query[paramName] || req.body[paramName];
    
    if (!value) {
      if (isRequired) {
        return res.status(400).json({
          success: false,
          message: `El parámetro ${paramName} es requerido`,
          errorCode: 'MISSING_REQUIRED_PARAM'
        });
      }
      return next();
    }
    
    if (!allowedValues.includes(value)) {
      return res.status(400).json({
        success: false,
        message: `Valor inválido para ${paramName}. Valores permitidos: ${allowedValues.join(', ')}`,
        errorCode: 'INVALID_ENUM_VALUE',
        allowedValues
      });
    }
    
    next();
  };
};

/**
 * Valida múltiples parámetros a la vez
 */
const validateParams = (validations) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [paramName, validation] of Object.entries(validations)) {
      const value = req.query[paramName] || req.body[paramName];
      
      // Validar si es requerido
      if (validation.required && !value) {
        errors.push({
          param: paramName,
          message: `${paramName} es requerido`,
          code: 'REQUIRED'
        });
        continue;
      }
      
      if (!value) continue;
      
      // Validar tipo
      if (validation.type) {
        switch (validation.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push({
                param: paramName,
                message: `${paramName} debe ser un número`,
                code: 'INVALID_TYPE'
              });
            }
            break;
          case 'boolean':
            if (value !== 'true' && value !== 'false' && value !== true && value !== false) {
              errors.push({
                param: paramName,
                message: `${paramName} debe ser true o false`,
                code: 'INVALID_TYPE'
              });
            }
            break;
          case 'date':
            if (isNaN(Date.parse(value))) {
              errors.push({
                param: paramName,
                message: `${paramName} debe ser una fecha válida`,
                code: 'INVALID_DATE'
              });
            }
            break;
        }
      }
      
      // Validar rango
      if (validation.min !== undefined && Number(value) < validation.min) {
        errors.push({
          param: paramName,
          message: `${paramName} debe ser mayor o igual a ${validation.min}`,
          code: 'OUT_OF_RANGE'
        });
      }
      
      if (validation.max !== undefined && Number(value) > validation.max) {
        errors.push({
          param: paramName,
          message: `${paramName} debe ser menor o igual a ${validation.max}`,
          code: 'OUT_OF_RANGE'
        });
      }
      
      // Validar enum
      if (validation.enum && !validation.enum.includes(value)) {
        errors.push({
          param: paramName,
          message: `${paramName} debe ser uno de: ${validation.enum.join(', ')}`,
          code: 'INVALID_ENUM'
        });
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errorCode: 'VALIDATION_ERROR',
        errors
      });
    }
    
    next();
  };
};

module.exports = {
  validateLimit,
  validatePage,
  validateDateParams,
  validateDateRange,
  validateEnum,
  validateParams
};
