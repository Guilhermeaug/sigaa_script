# Sigaa Script

## Descrição
Esse é um script feito em nodejs para automatizar o processo de verificação de notas na plataforma SIGAA utilizada pelo
CEFETMG. O objetivo é simples: uma vez que a maioria dos lançamentos na plataforma não são notificados de nenhuma forma,
o script verifica periodicamente se houve alguma alteração na nota de alguma disciplina e notifica o usuário
por meio de uma mensagem no **Discord**.

## Como utilizar
* Certifique-se que você possuí o **NodeJS** a partir da versão 16 instalado em sua máquina.
* Copie o conteúdo do arquivo **.env.example** para um arquivo chamado **.env** e preencha os campos com as informações:
    * **USUARIO**: seu usuário do SIGAA
    * **SENHA**: sua senha do SIGAA
    * **WEBHOOK_ID**: o id do webhook do canal de texto do discord que você deseja receber as notificações
    * **WEBHOOK_TOKEN**: o token do webhook do canal de texto do discord que você deseja receber as notificações
  
Execute o comando `npm install` para instalar as dependências do projeto. O webhook do discord pode ser criado
na parte de configurações do canal de texto desejado. Para mais informações, acesse a [ajuda do discord](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks).
Você deve pegar os campos de ID e TOKEN da url gerada. Exemplo
`https://discord.com/api/webhooks/123456789018/abcdefghijklmn4567890`, onde o ID é
123456789018 e o token é abcdefghijklmn4567890.

Por fim, basta executar o script com o comando `npm start` e ele irá verificar periodicamente se houve alguma alteração.
