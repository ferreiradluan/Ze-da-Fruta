export class CreateUsuarioDto {
  nome!: string;
  email!: string;
  senha!: string;
  telefone!: string;
}

// filepath: /workspaces/Projeto-typescript/nestjs-crud-app-2/src/usuarios/dto/update-usuario.dto.ts
export class UpdateUsuarioDto {
  nome?: string;
  email?: string;
  senha?: string;
  telefone?: string;
}