import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { tareasModel } from "./tareas.model";


@Entity({ name: "usuarios" })
export class usuarioModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column()
    email: string;

    @Column()
    contrasena: string;

    @OneToMany(() => tareasModel, (tarea) => tarea.usuario)
    tareas: tareasModel[];
}