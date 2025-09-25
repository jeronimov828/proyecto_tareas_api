import { responseUtils } from "../utils/response.utils";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { tareasModel } from "../model/tareas.model";
import { usuarioModel } from "../model/usuario.model";

/**
 * @swagger
 * components:
 *   schemas:
 *     TareaCreate:
 *       type: object
 *       required:
 *         - titulo
 *       properties:
 *         titulo:
 *           type: string
 *           description: Título de la tarea
 *         descripcion:
 *           type: string
 *           description: Descripción de la tarea
 *         fecha_vencimiento:
 *           type: string
 *           format: date-time
 *           description: Fecha de vencimiento
 *         completada:
 *           type: boolean
 *           description: Estado de completado
 *     TareaUpdate:
 *       type: object
 *       properties:
 *         titulo:
 *           type: string
 *           description: Título de la tarea
 *         descripcion:
 *           type: string
 *           description: Descripción de la tarea
 *         fecha_vencimiento:
 *           type: string
 *           format: date-time
 *           description: Fecha de vencimiento
 *         completada:
 *           type: boolean
 *           description: Estado de completado
 */

// Extendemos la interfaz Request
interface AuthRequest extends Request {
  user?: { id: number };
}

class tareaController {
  /**
   * @swagger
   * /tareas:
   *   post:
   *     summary: Crear una nueva tarea
   *     tags: [Tareas]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TareaCreate'
   *     responses:
   *       201:
   *         description: Tarea creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Tarea'
   *       404:
   *         description: Usuario no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
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

  /**
   * @swagger
   * /listarTareas:
   *   get:
   *     summary: Obtener todas las tareas del usuario autenticado
   *     tags: [Tareas]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de tareas obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ResponseUtils'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Tarea'
   *       401:
   *         description: Usuario no autenticado
   */
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

  /**
   * @swagger
   * /editarTareas/{id}:
   *   put:
   *     summary: Actualizar una tarea específica
   *     tags: [Tareas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la tarea a actualizar
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TareaUpdate'
   *     responses:
   *       200:
   *         description: Tarea actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ResponseUtils'
   *       401:
   *         description: No autorizado
   *       404:
   *         description: Tarea no encontrada o sin permisos
   */
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

  /**
   * @swagger
   * /listarTareas/{id}:
   *   get:
   *     summary: Obtener una tarea específica por ID
   *     tags: [Tareas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la tarea a obtener
   *     responses:
   *       200:
   *         description: Tarea obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ResponseUtils'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Tarea'
   *       400:
   *         description: ID inválido
   *       404:
   *         description: Tarea no encontrada
   */
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
}

export default new tareaController();
