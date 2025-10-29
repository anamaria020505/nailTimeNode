const jwt = require("jsonwebtoken");
const AppError = require("../errors/AppError");

const authenticate = (roles:string[]) => {
  return function (req: any, res:any, next:any) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(new AppError("Necesita iniciar sesión", 401));
    }
    const token = authHeader.split(" ")[1];
    try {
      const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
      if (roles.includes(decodeToken.role)) {
        req.userData = { usuario: decodeToken.usuario };
        next();
      } else {
        return next(new AppError("No tiene permisos para esta acción", 401));
      }
    } catch (error) {
        console.log(error)
      return next(new AppError("Permiso denegado", 403));
    }
  };
};
module.exports = authenticate;