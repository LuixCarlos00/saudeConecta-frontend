import { Adiministrador } from "src/app/shared/models/adiministrador";
import { Medico } from "../medico/medico";
import { Paciente } from "src/app/shared/models/paciente";

export interface Tabela {
  consulta: number;
  medico: Medico;
  paciente: Paciente;
  data: string;
  horario: string;
  observacao: string;
  dadaCriacao: string;
  status: number;
  adm: Adiministrador
  formaPagamento: number
}

