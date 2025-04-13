import { Router } from "express";
import tareaController from "../controller/tarea.controller";
import { check } from "express-validator";
import { authMiddleware } from "../middlewares/authMiddleware";

let routerTarea = Router();

routerTarea.post("/tareas",authMiddleware, tareaController.create);
routerTarea.get("/listarTareas",authMiddleware, tareaController.index);
routerTarea.put("/editarTareas:id",authMiddleware, tareaController.update);
routerTarea.get("/listarTareas/:id",authMiddleware, tareaController.get);

export default routerTarea;