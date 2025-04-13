import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { usuarioModel } from "./usuario.model";



@Entity({ name: "tareas" })
export class tareasModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    titulo: string;

    @Column({ nullable: true })
    descripcion: string;

    @Column({ type: "timestamp", nullable: true })
    fecha_vencimiento: Date;

    @Column({ type: "boolean", default: false })
    completada: boolean;

    @ManyToOne(() => usuarioModel, (usuario) => usuario.tareas, { onDelete: "CASCADE" })
    @JoinColumn({ name: "usuario_id" }) // ✅ Forzar el nombre correcto de la columna en la BD
    usuario: usuarioModel;
}