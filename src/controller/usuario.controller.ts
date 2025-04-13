import { responseUtils } from "../utils/response.utils";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { usuarioModel } from "../model/usuario.model";

const JWT_SECRET = "secreto_super_seguro"; // Usa variables de entorno en producción

class usuarioController {
    async create(req: Request, res: Response): Promise<void> {
        try {
            const { nombre, email, contrasena } = req.body
            const verificarUsuario = await getRepository(usuarioModel).findOneBy({ nombre });
            if (verificarUsuario) {
                await res.status(400).json(new responseUtils(false, [], null, "El usuario ya existe"));
                return
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasena, salt);

            const nuevoUsuario = getRepository(usuarioModel).create({
                nombre,
                email,
                contrasena: hashedPassword, // Guardamos la contraseña hasheada
            });

            const guardarNuevoUsuario = getRepository(usuarioModel).save(nuevoUsuario);
            await res.json(new responseUtils(true, [], guardarNuevoUsuario, "Usuario creado con éxito"));
            return
        } catch (error) {
            console.error("Error al crear usuario:", error);
            await res.status(500).json(new responseUtils(false, [], null, "Error en el servidor"));
            return
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        const { nombre, email, contrasena } = req.body;

        try {
            const buscaUsuario = await getRepository(usuarioModel).findOneBy({ nombre });
            if (!buscaUsuario) {
                await res.json(new responseUtils(false, [], null, "El usuario no existe"));
                return
            }

            const validarContrasena = await bcrypt.compare(contrasena, String(buscaUsuario.contrasena));
            console.log(validarContrasena)
            if (!validarContrasena) {
                await res.json(new responseUtils(false, [], null, "Contraseña incorrecta"));
                return;
            }

            console.log("Usuario encontrado:", buscaUsuario);
            const token = jwt.sign(
                { id_usuario: buscaUsuario.id, email: buscaUsuario.email }, // Aquí aseguramos que el ID sea correcto
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // **Enviar respuesta con token**
            res.json(new responseUtils(true, [], { usuario: buscaUsuario, token }, "Login exitoso"));
        } catch (error) {
            console.error("Error en el login", error);
            await res.json(new responseUtils(false, [], null, "Error en el servidor"));
            return;
        }
    }
}

export default new usuarioController();