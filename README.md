# Gerador de Arquivo AFD - Portarias 1510 e 671

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)

Este repositório contém uma aplicação web que gera arquivos AFD (Arquivo Fonte de Dados) de acordo com as especificações das Portarias 1510 e 671 do Ministério do Trabalho. O AFD é utilizado por sistemas de ponto eletrônico e contém registros de marcações de entrada e saída dos empregados.

A aplicação permite que o usuário informe dados do empregador e do empregado, horários de trabalho e o número de dias a serem gerados. Com essas informações, o sistema produz um arquivo texto no formato exigido por cada portaria, pronto para ser utilizado em sistemas de registro eletrônico de ponto.

## Funcionalidades

- **Geração de arquivo AFD (Portaria 1510 ou 671)**: Escolha entre CPF ou PIS como identificador do empregado, o que define o padrão da portaria.
- **Personalização de dados**:
  - Nome e CNPJ do empregador.
  - Número de série do REP.
  - Identificador (CPF ou PIS) do empregado.
  - Horários de entrada e saída (duas marcações por dia).
  - Quantidade de dias para gerar o histórico.
- **Geração automática de registros**:
  - Cabeçalho (Tipo 1).
  - Marcações de ponto (Tipo 3 para 1510, Tipo 7 para 671).
  - Trailer com totalizadores.
- **Hash criptográfico**: Implementação do cálculo de hash SHA-256 para os registros da Portaria 671.

## Como usar

1. Acesse a interface web.
2. Preencha os campos obrigatórios:
   - Nome e CNPJ do empregador.
   - Número de série do REP.
   - Tipo de identificador (PIS ou CPF).
   - Identificador do empregado.
   - Horários de entrada e saída.
   - Número de dias a gerar.
3. Clique em **Gerar Arquivo**.
4. O download do arquivo `.txt` será iniciado automaticamente.

### Tecnologias Utilizadas

- **HTML/CSS**: Interface responsiva e moderna com layout em `card`.
- **JavaScript**: Lógica para gerar os registros AFD, aplicar formatação e calcular hashes.
- **PHP**: Estrutura do formulário e manipulação inicial da página (no arquivo `index.php`).

### Estrutura dos Arquivos

- `index.php`: Página principal com o formulário HTML.
- `style.css`: Estilização da interface com foco em usabilidade e responsividade.
- `script.js`: Lógica de geração do arquivo AFD, com suporte aos dois modelos de portaria.

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/gerador-afd-portaria.git
   ```

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
