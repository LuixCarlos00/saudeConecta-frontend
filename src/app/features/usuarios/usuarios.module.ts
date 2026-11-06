import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgChartsModule } from 'ng2-charts';
import { UsuariosRoutingModule } from './usuarios-routing.module';
import { CadastroAdmComponent } from 'src/app/features/usuarios/pages/cadastro-adm/cadastro-adm.component';
import { CadastroAdminOrgComponent } from 'src/app/features/usuarios/pages/cadastro-admin-org/cadastro-admin-org.component';
import { CadastroMedicoComponent } from 'src/app/features/usuarios/pages/cadastro-medico/cadastro-medico.component';
import { CadastroSecretariaComponent } from 'src/app/features/usuarios/pages/cadastro-secretaria/cadastro-secretaria.component';
import { DadosPessoaisComponent } from 'src/app/features/usuarios/pages/dados-pessoais/DadosPessoais.component';
import { GerenciamentoUsuarioComponent } from 'src/app/features/usuarios/pages/gerenciamento-usuarios/gerenciamento-usuario.component';
import { TrocaSenhaUsuariosComponent } from 'src/app/features/usuarios/pages/gerenciamento-usuarios/tabela-todos-usuarios/TrocaSenhaUsuarios/TrocaSenhaUsuarios.component';
import { VisualizarEditarUsuarioComponent } from 'src/app/features/usuarios/pages/gerenciamento-usuarios/tabela-todos-usuarios/VisualizarEditarUsuario/visualizar-editar-usuario.component';
import { TabelaTodosUsuariosComponent } from 'src/app/features/usuarios/pages/gerenciamento-usuarios/tabela-todos-usuarios/tabela-todos-usuarios.component';

/**
 * Modulo da area usuarios: gerenciamento de usuarios, cadastros e dados pessoais.
 * Carregado sob demanda (lazy) pelo app-routing.
 */
@NgModule({
  declarations: [
    GerenciamentoUsuarioComponent,
    TabelaTodosUsuariosComponent,
    TrocaSenhaUsuariosComponent,
    VisualizarEditarUsuarioComponent,
    CadastroAdmComponent,
    CadastroAdminOrgComponent,
    CadastroMedicoComponent,
    CadastroSecretariaComponent,
    DadosPessoaisComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDialogModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgChartsModule,
    UsuariosRoutingModule,
  ],
})
export class UsuariosModule {}
