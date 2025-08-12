/**
 * Atualiza o texto da label do campo de identificador (PIS ou CPF)
 * com base na seleção do tipo de portaria.
 */
function updateIdLabel() {
  const idType = document.getElementById('idType').value;
  const idLabel = document.getElementById('idLabel');
  idLabel.textContent = idType === 'pis' ? 'PIS do Empregado' : 'CPF do Empregado';
}

/**
 * Adiciona um event listener para abrir o seletor de data nativo do navegador
 * ao clicar no campo, melhorando a experiência do usuário.
 */
document.getElementById('startDate').addEventListener('click', function () {
  try {
    this.showPicker();
  } catch (e) {
    // Fallback para navegadores que não suportam showPicker()
    this.focus();
  }
});

/**
 * Adiciona um event listener ao formulário para interceptar o envio,
 * prevenir o comportamento padrão e chamar a função principal de geração do AFD.
 */
document.getElementById('afdForm').addEventListener('submit', function (e) {
  e.preventDefault();
  generateAfd();
});

/**
 * Calcula o CRC-16 (Cyclic Redundancy Check) de uma string de dados.
 * Este cálculo é uma exigência da Portaria 671 para garantir a integridade dos registros.
 * @param {string} data A string de dados para a qual o CRC-16 será calculado.
 * @returns {string} O valor do CRC-16 em formato hexadecimal com 4 caracteres.
 */
function calculateCRC16(data) {
  let crc = 0xffff;
  const polynomial = 0xa001; // Polinômio padrão para CRC-16-MODBUS
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ polynomial;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Função principal que orquestra a geração do arquivo AFD.
 * Ela coleta os dados do formulário, decide qual leiaute de portaria usar,
 * monta os registros e dispara o download do arquivo .txt.
 */
function generateAfd() {
  // 1. Coleta e formatação dos dados do formulário
  const idType = document.getElementById('idType').value;
  const identifier = document.getElementById('identifier').value.padStart(12, '0');
  const employerName = document.getElementById('employerName').value.padEnd(150, ' ');
  const employerCnpj = document.getElementById('employerCnpj').value.padStart(14, '0');
  const repNumber = document.getElementById('repNumber').value.padStart(17, '0');

  const startDateInput = document.getElementById('startDate').value;
  const [year, month, day] = startDateInput.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);

  const days = parseInt(document.getElementById('days').value);

  // Lógica de coleta de horários flexível: coleta todos os inputs
  // e filtra para usar apenas os que foram preenchidos pelo usuário.
  const allTimesInput = [document.getElementById('entry1').value, document.getElementById('exit1').value, document.getElementById('entry2').value, document.getElementById('exit2').value];
  const timesPreenchidos = allTimesInput.filter((time) => time !== '');

  // 2. Inicialização de variáveis de controle
  let nsr = 1; // Número Sequencial de Registro
  let records = []; // Array que armazenará todas as linhas do arquivo
  let recordCounts = { type2: 0, type3: 0, type4: 0, type5: 0, type6: 0, type7: 0 };

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + days - 1);

  // 3. Lógica de Geração baseada na Portaria selecionada
  if (idType === 'pis') {
    // --- Bloco de geração para Portaria 1510 ---
    const header = ['000000000', '1', '1', employerCnpj, ''.padStart(12, '0'), employerName, repNumber, formatDate1510(startDate), formatDate1510(endDate), formatDate1510(new Date()), formatTime1510(new Date())].join('');
    records.push(header);

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = formatDate1510(currentDate);

      // Loop dinâmico que gera registros apenas para os horários preenchidos
      for (const time of timesPreenchidos) {
        const timeFormatado = time.replace(':', '');
        records.push([nsr.toString().padStart(9, '0'), '3', dateStr, timeFormatado, identifier].join(''));
        nsr++;
        recordCounts.type3++;
      }
    }

    const trailer = ['999999999', recordCounts.type2.toString().padStart(9, '0'), recordCounts.type3.toString().padStart(9, '0'), recordCounts.type4.toString().padStart(9, '0'), recordCounts.type5.toString().padStart(9, '0'), '9'].join('');
    records.push(trailer);
  } else {
    // --- Bloco de geração para Portaria 671 (REP-C) ---
    const dataGeracao = new Date();
    const headerFields = ['000000000', '1', '1', employerCnpj, ''.padStart(14, '0'), employerName, repNumber, formatarDataHoraRegistro(startDate, '00:00').substring(0, 10), formatarDataHoraRegistro(endDate, '00:00').substring(0, 10), formatarDataHoraRegistro(dataGeracao, `${dataGeracao.getHours().toString().padStart(2, '0')}:${dataGeracao.getMinutes().toString().padStart(2, '0')}`), '003', '1', '98765432000195', 'REP-C EXEMPLO'.padEnd(30, ' '), ''];
    const headerWithoutCRC = headerFields.slice(0, -1).join('');
    headerFields[14] = calculateCRC16(headerWithoutCRC).padStart(4, '0');
    records.push(headerFields.join(''));

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Loop dinâmico que gera registros apenas para os horários preenchidos
      for (let j = 0; j < timesPreenchidos.length; j++) {
        const horaCompleta = timesPreenchidos[j];
        const dataHoraFormatada = formatarDataHoraRegistro(currentDate, horaCompleta);

        const record = [nsr.toString().padStart(9, '0'), '3', dataHoraFormatada, identifier, ''];
        const recordWithoutCRC = record.slice(0, -1).join('');
        record[4] = calculateCRC16(recordWithoutCRC).padStart(4, '0');
        records.push(record.join(''));
        nsr++;
        recordCounts.type3++;
      }
    }

    const trailer = ['999999999', recordCounts.type2.toString().padStart(9, '0'), recordCounts.type3.toString().padStart(9, '0'), recordCounts.type4.toString().padStart(9, '0'), recordCounts.type5.toString().padStart(9, '0'), recordCounts.type6.toString().padStart(9, '0'), recordCounts.type7.toString().padStart(9, '0'), '9'].join('');
    records.push(trailer);
  }

  // 4. Geração e Download do Arquivo
  const fileContent = records.join('\r\n'); // Une todas as linhas com quebra de linha padrão Windows
  const blob = new Blob([fileContent], { type: 'text/plain;charset=iso-8859-1' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = idType === 'pis' ? 'AFD_PIS.txt' : `AFD${repNumber}${employerCnpj}REP_C.txt`;
  a.click(); // Simula o clique no link para iniciar o download
  window.URL.revokeObjectURL(url); // Libera a memória do objeto URL criado
}

// =================================================================================
// --- FUNÇÕES AUXILIARES ---
// As funções abaixo são utilitárias, chamadas pela função principal `generateAfd`
// para formatar dados em padrões específicos exigidos por cada portaria.
// Manter essa separação torna o código principal mais limpo e legível.
// =================================================================================

/**
 * Formata um objeto Date para o padrão de data da Portaria 1510 (DDMMYYYY).
 * @param {Date} date O objeto Date a ser formatado.
 * @returns {string} A data formatada como string.
 */
function formatDate1510(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

/**
 * Formata um objeto Date para o padrão de hora da Portaria 1510 (HHMM).
 * @param {Date} date O objeto Date a ser formatado.
 * @returns {string} A hora formatada como string.
 */
function formatTime1510(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}${minutes}`;
}

/**
 * Formata data e hora para o padrão completo exigido pela Portaria 671.
 * O formato final é "AAAA-MM-DDTHH:mm:ssZZZZZ".
 * * @param {Date} data O objeto Date do dia para o qual o registro será gerado.
 * @param {string} horaMinuto A hora da marcação, no formato "HH:MM" (ex: "08:00").
 * @returns {string} A string de data e hora completa no padrão exigido.
 */
function formatarDataHoraRegistro(data, horaMinuto) {
  const ano = data.getFullYear();
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const dia = data.getDate().toString().padStart(2, '0');
  const [hora, minuto] = horaMinuto.split(':');

  // O fuso horário -03:00 é um requisito comum para sistemas no Brasil,
  // representando o horário padrão de Brasília (UTC-3). Este valor é fixo
  // conforme a especificação do leiaute do AFD.
  const fusoHorario = '-0300';

  return `${ano}-${mes}-${dia}T${hora}:${minuto}:00${fusoHorario}`;
}
