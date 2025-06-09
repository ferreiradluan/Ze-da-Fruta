import { Specification } from '../../../common/domain/specifications/specification.base';
import { Usuario, StatusUsuario, TipoUsuario } from '../entities/usuario.entity';

/**
 * Specification to check if a user is active
 */
export class UsuarioAtivoSpecification extends Specification<Usuario> {
  isSatisfiedBy(usuario: Usuario): boolean {
    return usuario.status === StatusUsuario.ATIVO;
  }
}

/**
 * Specification to check if a user is verified (email and optionally phone)
 */
export class UsuarioVerificadoSpecification extends Specification<Usuario> {
  constructor(private requirePhoneVerification: boolean = false) {
    super();
  }

  isSatisfiedBy(usuario: Usuario): boolean {
    const emailVerificado = usuario.emailVerificado;
    
    if (this.requirePhoneVerification && usuario.telefone) {
      return emailVerificado && usuario.telefoneVerificado;
    }
    
    return emailVerificado;
  }
}

/**
 * Specification to check if a user can perform administrative actions
 */
export class UsuarioAdminSpecification extends Specification<Usuario> {
  isSatisfiedBy(usuario: Usuario): boolean {
    return usuario.tipo === TipoUsuario.ADMIN && 
           usuario.status === StatusUsuario.ATIVO &&
           usuario.temRole('ADMIN');
  }
}

/**
 * Specification to check if a user can manage products
 */
export class UsuarioPodeGerenciarProdutosSpecification extends Specification<Usuario> {
  isSatisfiedBy(usuario: Usuario): boolean {
    return (usuario.tipo === TipoUsuario.LOJISTA || usuario.tipo === TipoUsuario.ADMIN) &&
           usuario.status === StatusUsuario.ATIVO &&
           (usuario.temPermissao('produto.criar') || usuario.temPermissao('*'));
  }
}

/**
 * Specification to check if a user can place orders
 */
export class UsuarioPodeFazerPedidosSpecification extends Specification<Usuario> {
  isSatisfiedBy(usuario: Usuario): boolean {
    return usuario.status === StatusUsuario.ATIVO &&
           usuario.emailVerificado &&
           usuario.tipo !== TipoUsuario.ADMIN; // Admins typically don't place orders
  }
}

/**
 * Specification to check if a user account is secure
 * (verified, no recent failed login attempts, etc.)
 */
export class UsuarioSeguroSpecification extends Specification<Usuario> {
  isSatisfiedBy(usuario: Usuario): boolean {
    const temTentativasRecentes = usuario.tentativasLogin > 0;
    const ultimaTentativaRecente = usuario.dataUltimaTentativaLogin && 
      (Date.now() - usuario.dataUltimaTentativaLogin.getTime()) < (24 * 60 * 60 * 1000); // 24 horas
    
    return usuario.status === StatusUsuario.ATIVO &&
           usuario.emailVerificado &&
           !temTentativasRecentes &&
           !ultimaTentativaRecente;
  }
}

/**
 * Specification to check if a user needs password reset
 */
export class UsuarioPrecisaResetSenhaSpecification extends Specification<Usuario> {
  isSatisfiedBy(usuario: Usuario): boolean {
    // User has too many failed login attempts
    if (usuario.tentativasLogin >= 5) {
      return true;
    }

    // User is suspended due to security issues
    if (usuario.status === StatusUsuario.SUSPENSO) {
      return true;
    }

    // User has an active reset token (indicates they requested reset)
    if (usuario.tokenResetSenha && usuario.dataExpiracaoTokenReset) {
      return usuario.dataExpiracaoTokenReset > new Date();
    }

    return false;
  }
}

/**
 * Specification to check if a user can be promoted to a higher role
 */
export class UsuarioPodeSerPromovidoSpecification extends Specification<Usuario> {
  constructor(private targetType: TipoUsuario) {
    super();
  }

  isSatisfiedBy(usuario: Usuario): boolean {
    if (usuario.status !== StatusUsuario.ATIVO) {
      return false;
    }

    if (!usuario.emailVerificado) {
      return false;
    }

    // Define promotion hierarchy
    const hierarchy = [
      TipoUsuario.CLIENTE,
      TipoUsuario.ENTREGADOR,
      TipoUsuario.LOJISTA,
      TipoUsuario.ADMIN
    ];

    const currentIndex = hierarchy.indexOf(usuario.tipo);
    const targetIndex = hierarchy.indexOf(this.targetType);

    // Can only promote to higher levels
    return targetIndex > currentIndex;
  }
}

/**
 * Specification to check if a user account can be safely deleted
 */
export class UsuarioPodeSerExcluidoSpecification extends Specification<Usuario> {
  isSatisfiedBy(usuario: Usuario): boolean {
    // Cannot delete active admins
    if (usuario.tipo === TipoUsuario.ADMIN && usuario.status === StatusUsuario.ATIVO) {
      return false;
    }

    // Can delete inactive users
    if (usuario.status === StatusUsuario.INATIVO) {
      return true;
    }

    // Cannot delete users with recent activity
    if (usuario.dataUltimoLogin) {
      const ultimoLoginRecente = (Date.now() - usuario.dataUltimoLogin.getTime()) < (30 * 24 * 60 * 60 * 1000); // 30 dias
      if (ultimoLoginRecente) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Specification for high-trust users (can perform sensitive operations)
 */
export class UsuarioAltaConfiancaSpecification extends Specification<Usuario> {
  isSatisfiedBy(usuario: Usuario): boolean {
    // Must be active and verified
    if (usuario.status !== StatusUsuario.ATIVO || !usuario.emailVerificado) {
      return false;
    }

    // Must have CPF if required
    if (!usuario.cpf) {
      return false;
    }

    // No recent failed login attempts
    if (usuario.tentativasLogin > 0) {
      return false;
    }

    // Recent login activity
    if (!usuario.dataUltimoLogin) {
      return false;
    }

    const ultimoLoginRecente = (Date.now() - usuario.dataUltimoLogin.getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 dias
    
    return ultimoLoginRecente;
  }
}

/**
 * Composite specification for a fully compliant user
 */
export class UsuarioCompletoSpecification extends Specification<Usuario> {
  private ativoSpec = new UsuarioAtivoSpecification();
  private verificadoSpec = new UsuarioVerificadoSpecification(true);
  private seguroSpec = new UsuarioSeguroSpecification();

  isSatisfiedBy(usuario: Usuario): boolean {
    return this.ativoSpec.and(this.verificadoSpec).and(this.seguroSpec).isSatisfiedBy(usuario);
  }
}
