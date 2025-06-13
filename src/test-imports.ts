// Test imports to debug module resolution issues
import { SolicitacaoParceiro } from './1-account-management/domain/entities/solicitacao-parceiro.entity';
import { AccountService } from './1-account-management/application/services/account.service';

console.log('Imports successful');
console.log(typeof SolicitacaoParceiro);
console.log(typeof AccountService);
