/**
 * Atualiza o texto da label do campo de identificador (PIS ou CPF)
 * com base na seleção do tipo de portaria.
 */
function updateIdLabel() {
  const idType = document.getElementById('idType').value;
  document.getElementById('idLabel').textContent = idType === 'pis' ? 'PIS do Empregado' : 'CPF do Empregado';
}

/**
 * Adiciona um event listener para abrir o seletor de data nativo do navegador
 * ao clicar no campo, melhorando a experiência do usuário.
 */
document.getElementById('startDate').addEventListener('click', function () {
  try {
    this.showPicker(); // Tenta abrir o seletor de data
  } catch (e) {
    this.focus(); // Caso o navegador não suporte showPicker(), dá foco ao campo
  }
});

/**
 * Adiciona um event listener ao formulário para interceptar o envio,
 * prevenir o comportamento padrão e chamar a função principal de geração do AFD.
 */
document.getElementById('afdForm').addEventListener('submit', function (e) {
  e.preventDefault(); // Impede o envio tradicional do formulário (recarregar página)
  generateAfd(); // Chama a função para gerar o AFD
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
    crc ^= data.charCodeAt(i); // Calcula CRC
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x0001 ? (crc >> 1) ^ polynomial : crc >> 1;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0'); // Retorna o CRC em formato hexadecimal
}

/**
 * Função principal que orquestra a geração do arquivo AFD.
 * Ela coleta os dados do formulário, decide qual leiaute de portaria usar,
 * monta os registros e dispara o download do arquivo .txt.
 */
function generateAfd() {
  // Coleta e formatação dos dados do formulário
  const idType = document.getElementById('idType').value;
  const identifier = document.getElementById('identifier').value;
  const employerName = document.getElementById('employerName').value.padEnd(150, ' ');
  const employerCnpj = document.getElementById('employerCnpj').value.padStart(14, '0');
  const repNumber = document.getElementById('repNumber').value.padStart(17, '0');

  const startDateInput = document.getElementById('startDate').value;
  const [year, month, day] = startDateInput.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);

  const days = parseInt(document.getElementById('days').value); // Quantidade de dias

  // Coleta os horários preenchidos pelo usuário
  const allTimesInput = [document.getElementById('entry1').value, document.getElementById('exit1').value, document.getElementById('entry2').value, document.getElementById('exit2').value];
  const timesPreenchidos = allTimesInput.filter((time) => time !== ''); // Filtra os horários preenchidos

  let nsr = 1; // Número Sequencial de Registro
  let records = []; // Array que armazenará todos os registros
  let recordCounts = { type2: 0, type3: 0, type4: 0, type5: 0, type6: 0, type7: 0 }; // Contagem dos tipos de registro

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + days - 1); // Calcula a data final

  // Lógica para Portaria 1510 (PIS)
  if (idType === 'pis') {
    const header = ['000000000', '1', '1', employerCnpj, ''.padStart(12, '0'), employerName, repNumber, formatDate1510(startDate), formatDate1510(endDate), formatDate1510(new Date()), formatTime1510(new Date())].join('');
    records.push(header);

    // Geração dos registros para cada dia
    for (let i = 0; i < days; i++) {
      // Esta variável irá controlar o dia da jornada, sendo atualizada apenas na virada da meia-noite.
      const dataDoCiclo = new Date(startDate);
      dataDoCiclo.setDate(startDate.getDate() + i);

      for (let j = 0; j < timesPreenchidos.length; j++) {
        // Se a hora da marcação atual for menor que a anterior, significa que virou o dia.
        if (j > 0 && timesPreenchidos[j] < timesPreenchidos[j - 1]) {
          dataDoCiclo.setDate(dataDoCiclo.getDate() + 1);
        }

        // A data é formatada a cada iteração, usando a data do ciclo (potencialmente atualizada)
        const dateStr = formatDate1510(dataDoCiclo);
        const timeFormatado = timesPreenchidos[j].replace(':', '');

        records.push([nsr.toString().padStart(9, '0'), '3', dateStr, timeFormatado, identifier.padStart(12, '0')].join(''));
        nsr++;
        recordCounts.type3++;
      }
    }

    const trailer = ['999999999', recordCounts.type2.toString().padStart(9, '0'), recordCounts.type3.toString().padStart(9, '0'), recordCounts.type4.toString().padStart(9, '0'), recordCounts.type5.toString().padStart(9, '0'), '9'].join('');
    records.push(trailer); // Adiciona o trailer ao final dos registros
  } else {
    // Lógica para Portaria 671 (REP-C)
    const dataGeracao = new Date();
    const headerFields = ['000000000', '1', '1', employerCnpj, ''.padStart(14, '0'), employerName, repNumber, formatarDataHoraRegistro(startDate, '00:00').substring(0, 10), formatarDataHoraRegistro(endDate, '00:00').substring(0, 10), formatarDataHoraRegistro(dataGeracao, `${dataGeracao.getHours().toString().padStart(2, '0')}:${dataGeracao.getMinutes().toString().padStart(2, '0')}`), '003', '1', '98765432000195', 'REP-C EXEMPLO'.padEnd(30, ' '), ''];
    const headerWithoutCRC = headerFields.slice(0, -1).join('');
    headerFields[14] = calculateCRC16(headerWithoutCRC).padStart(4, '0');
    records.push(headerFields.join(''));

    // Geração dos registros para cada dia da Portaria 671
    for (let i = 0; i < days; i++) {
      // Esta variável irá controlar o dia da jornada, sendo atualizada apenas na virada da meia-noite.
      const dataDoCiclo = new Date(startDate);
      dataDoCiclo.setDate(startDate.getDate() + i);

      // Loop para cada horário preenchido
      for (let j = 0; j < timesPreenchidos.length; j++) {
        // Se a hora da marcação atual for menor que a anterior, significa que virou o dia.
        if (j > 0 && timesPreenchidos[j] < timesPreenchidos[j - 1]) {
          dataDoCiclo.setDate(dataDoCiclo.getDate() + 1);
        }

        // Usamos a dataDoCiclo (que pode ter sido atualizada) para a marcação atual.
        const dataHoraFormatada = formatarDataHoraRegistro(dataDoCiclo, timesPreenchidos[j]);

        const record = [nsr.toString().padStart(9, '0'), '3', dataHoraFormatada, identifier.padStart(12, '0'), ''];
        const recordWithoutCRC = record.slice(0, -1).join('');
        record[4] = calculateCRC16(recordWithoutCRC).padStart(4, '0');
        records.push(record.join(''));
        nsr++;
        recordCounts.type3++;
      }
    }

    const trailer = ['999999999', recordCounts.type2.toString().padStart(9, '0'), recordCounts.type3.toString().padStart(9, '0'), recordCounts.type4.toString().padStart(9, '0'), recordCounts.type5.toString().padStart(9, '0'), recordCounts.type6.toString().padStart(9, '0'), recordCounts.type7.toString().padStart(9, '0'), '9'].join('');
    records.push(trailer); // Adiciona o trailer ao final dos registros
  }

  // Geração e Download do Arquivo
  const fileContent = records.join('\r\n'); // Une todas as linhas com quebra de linha padrão Windows
  const blob = new Blob([fileContent], { type: 'text/plain;charset=iso-8859-1' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = idType === 'pis' ? 'AFD_PIS.txt' : `AFD${repNumber}${employerCnpj}REP_C.txt`;
  a.click(); // Simula o clique no link para iniciar o download
  window.URL.revokeObjectURL(url); // Libera a memória do objeto URL criado
}

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

  const fusoHorario = '-0300';

  return `${ano}-${mes}-${dia}T${hora}:${minuto}:00${fusoHorario}`;
}
