const mongoose = require('mongoose');

/**
 * Middleware para validar que los parámetros ID sean ObjectIds válidos de MongoDB
 * Previene errores 500 causados por IDs mal formados
 * 
 * @param {string} paramName - Nombre del parámetro a validar (default: 'id')
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return next(); // Si no hay ID, continuar (puede ser opcional)
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `ID inválido: ${paramName}`,
        errorCode: 'INVALID_OBJECT_ID'
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar múltiples IDs en una sola petición
 * Útil para operaciones batch
 */
const validateObjectIds = (...paramNames) => {
  return (req, res, next) => {
    const invalidParams = [];
    
    for (const paramName of paramNames) {
      const id = req.params[paramName] || req.body[paramName] || req.query[paramName];
      
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        invalidParams.push(paramName);
      }
    }
    
    if (invalidParams.length > 0) {
      return res.status(400).json({
        success: false,
        message: `IDs inválidos: ${invalidParams.join(', ')}`,
        errorCode: 'INVALID_OBJECT_IDS',
        invalidParams
      });
    }
    
    next();
  };
};

module.exports = {
  validateObjectId,
  validateObjectIds
};
