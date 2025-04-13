import { Router } from "express";
import usuarioController from "../controller/usuario.controller";
import { check } from "express-validator";

let caminoUsuario = Router();

caminoUsuario.post("/usuarios", usuarioController.create);
caminoUsuario.post("/login", usuarioController.login)

export default caminoUsuario;