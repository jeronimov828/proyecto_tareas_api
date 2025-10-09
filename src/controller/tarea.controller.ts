import { responseUtils } from "../utils/response.utils";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { tareasModel } from "../model/tareas.model";
import { usuarioModel } from "../model/usuario.model";

// Extendemos la interfaz Request
interface AuthRequest extends Request {
  user?: { id: number };
}

class tareaController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { titulo, descripcion, fecha_vencimiento, completada } = req.body;
      const usuario_id = req.user?.id; // ✅ Asegurar que este ID es correcto y proviene del token

      const usuario = await getRepository(usuarioModel).findOneBy({
        id: usuario_id,
      });

      if (!usuario) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      const nuevaTarea = getRepository(tareasModel).create({
        usuario, // ✅ Relacionamos la tarea con el usuario correctamente
        titulo,
        descripcion,
        fecha_vencimiento,
        completada,
      });

      const tareaGuardada = await getRepository(tareasModel).save(nuevaTarea);
      res.status(201).json(tareaGuardada);
    } catch (error) {
      console.error("Error al crear tu tarea:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }

  async index(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuario_id = req.user?.id; // Obtener el ID del usuario autenticado

      if (!usuario_id) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      const tareas = await getRepository(tareasModel).find({
        where: { usuario: { id: usuario_id } },
        relations: ["usuario"], // Asegurar que se obtiene la relación con el usuario
      });
      await res.json(new responseUtils(true, tareas));
      return;
    } catch (error) {
      await res.json(new responseUtils(false, [], null, error.message));
      return;
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        res.status(401).json({ error: "No autorizado. Token inválido." });
        return;
      }

      // Buscar la tarea y verificar que pertenece al usuario
      const tarea = await getRepository(tareasModel).findOne({
        where: {
          id: parseInt(req.params.id),
          usuario: { id: usuario_id }, // 👈 asegura que el usuario solo actualiza sus tareas
        },
        relations: ["usuario"], // Asegura que cargue la relación
      });

      if (!tarea) {
        res.status(404).json({
          error: "Tarea no encontrada o no tienes permiso para editarla.",
        });
        return;
      }

      // Mezclar cambios y guardar
      getRepository(tareasModel).merge(tarea, req.body);
      const resultado = await getRepository(tareasModel).save(tarea);

      res.json(
        new responseUtils(true, [], resultado, "Tarea modificada correctamente")
      );
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
      res
        .status(500)
        .json(new responseUtils(false, [], null, "Error en el servidor"));
    }
  }

  async get(Request: Request, Response: Response): Promise<void> {
    try {
      const id = parseInt(Request.params.id);

      if (isNaN(id)) {
        await Response.status(400).json(
          new responseUtils(false, [], null, "ID inválido")
        );
        return;
      }

      const producto = await getRepository(tareasModel).findOne({
        where: { id },
      });

      await Response.json(new responseUtils(true, [], producto));
      return;
    } catch (ex) {
      await Response.json(new responseUtils(false, [], null, ex.message));
      return;
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        res.status(401).json({ error: "No autorizado. Token inválido." });
        return;
      }

      // Buscar la tarea y verificar que pertenece al usuario
      const tarea = await getRepository(tareasModel).findOne({
        where: {
          id: parseInt(req.params.id),
          usuario: { id: usuario_id }, // 👈 asegura que el usuario solo actualiza sus tareas
        },
        relations: ["usuario"], // Asegura que cargue la relación
      });

      if (!tarea) {
        res.status(404).json({
          error: "Tarea no encontrada o no tienes permiso para borrarla.",
        });
        return;
      }

      // Mezclar cambios y guardar
      getRepository(tareasModel).merge(tarea, req.body);
      const resultado = await getRepository(tareasModel).delete(tarea);

      res.json(
        new responseUtils(true, [], resultado, "Tarea borrada correctamente")
      );
    } catch (error) {
      console.error("Error al borrar la tarea:", error);
      res
        .status(500)
        .json(new responseUtils(false, [], null, "Error en el servidor"));
    }
  }
}

export default new tareaController();
