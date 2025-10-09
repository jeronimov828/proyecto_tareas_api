import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Definir interfaz para incluir `user` en `Request`
interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Obtener el token sin "Bearer"

  if (!token) {
    res.status(401).json({ error: "Acceso denegado. No hay token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id_usuario: number;
      email: string;
    };

    // ✅ Asegurar que el ID se asigna correctamente
    req.user = { id: decoded.id_usuario, email: decoded.email };

    next();
  } catch (error) {
    res.status(403).json({ error: "Token inválido" });
  }
};
