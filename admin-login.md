# Painel de Administrador - Instruções de Acesso

Para acessar o painel de administração do sistema, utilize as credenciais abaixo. O login de administrador NÃO utiliza Google OAuth, apenas autenticação local (usuário/senha).

## Como cadastrar um administrador

1. Gere um hash seguro da senha desejada (exemplo usando bcrypt):
   
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('Zedafruta@2025', 10))"
   ```

2. Adicione o usuário administrador manualmente no banco de dados, ou utilize um seed/script conforme exemplo abaixo:

   | email                | senha_hash (bcrypt)                                                    | role   |
   |----------------------|-----------------------------------------------------------------------|--------|
   | admin@zedafruta.com  | $2b$10$mAsvA0Il6yAmiYW1xugjA.BS4AcWe0QxzHD3fwNqACqoYl277NNCe           | admin  |

3. Certifique-se de que o campo `provider` do usuário admin seja 'local'.

## Exemplo de Objeto Admin

```json
{
  "email": "admin@zedafruta.com",
  "senha": "$2b$10$mAsvA0Il6yAmiYW1xugjA.BS4AcWe0QxzHD3fwNqACqoYl277NNCe",
  "role": "admin",
  "provider": "local"
}
```

## Segurança
- Nunca compartilhe este arquivo publicamente.
- Altere a senha padrão após o primeiro acesso.
- O backend só permite login de admin via autenticação local.
