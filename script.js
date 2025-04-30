function updateIdLabel() {
  const idType = document.getElementById('idType').value;
  const idLabel = document.getElementById('idLabel');
  idLabel.textContent = idType === 'pis' ? 'PIS do Empregado' : 'CPF do Empregado';
}

// Abrir o calendário ao clicar no campo de data
document.getElementById('startDate').addEventListener('click', function () {
  try {
    this.showPicker();
  } catch (e) {
    // Fallback para navegadores que não suportam showPicker
    this.focus();
  }
});

document.getElementById('afdForm').addEventListener('submit', function (e) {
  e.preventDefault();
  generateAfd();
});

function calculateCRC16(data) {
  let crc = 0xffff;
  const polynomial = 0xa001;

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

function generateAfd() {
  const idType = document.getElementById('idType').value;
  const identifier = document.getElementById('identifier').value.padStart(idType === 'pis' ? 12 : 12, '0');
  const employerName = document.getElementById('employerName').value.padEnd(150, ' ');
  const employerCnpj = document.getElementById('employerCnpj').value.padStart(14, '0');
  const repNumber = document.getElementById('repNumber').value.padStart(17, '0');
  // Processar data inicial sem fuso horário
  const startDateInput = document.getElementById('startDate').value;
  const [year, month, day] = startDateInput.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);
  const days = parseInt(document.getElementById('days').value);
  const entry1 = document.getElementById('entry1').value.replace(':', '');
  const exit1 = document.getElementById('exit1').value.replace(':', '');
  const entry2 = document.getElementById('entry2').value.replace(':', '');
  const exit2 = document.getElementById('exit2').value.replace(':', '');

  let nsr = 1;
  let records = [];
  let recordCounts = { type2: 0, type3: 0, type4: 0, type5: 0, type6: 0, type7: 0 };

  // Data final
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + days - 1);

  if (idType === 'pis') {
    // Portaria 1510
    // Cabeçalho (tipo 1)
    const header = [
      '000000000', // Campo 1
      '1', // Campo 2
      '1', // Campo 3 (CNPJ)
      employerCnpj, // Campo 4
      ''.padStart(12, '0'), // Campo 5 (CEI)
      employerName, // Campo 6
      repNumber, // Campo 7
      formatDate1510(startDate), // Campo 8
      formatDate1510(endDate), // Campo 9
      formatDate1510(new Date()), // Campo 10
      formatTime1510(new Date()), // Campo 11
    ].join('');
    records.push(header);

    // Marcações (tipo 3)
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = formatDate1510(currentDate);

      // Entrada 1
      records.push([nsr.toString().padStart(9, '0'), '3', dateStr, entry1, identifier].join(''));
      nsr++;
      recordCounts.type3++;

      // Saída 1
      records.push([nsr.toString().padStart(9, '0'), '3', dateStr, exit1, identifier].join(''));
      nsr++;
      recordCounts.type3++;

      // Entrada 2
      records.push([nsr.toString().padStart(9, '0'), '3', dateStr, entry2, identifier].join(''));
      nsr++;
      recordCounts.type3++;

      // Saída 2
      records.push([nsr.toString().padStart(9, '0'), '3', dateStr, exit2, identifier].join(''));
      nsr++;
      recordCounts.type3++;
    }

    // Trailer (tipo 9)
    const trailer = ['999999999', recordCounts.type2.toString().padStart(9, '0'), recordCounts.type3.toString().padStart(9, '0'), recordCounts.type4.toString().padStart(9, '0'), recordCounts.type5.toString().padStart(9, '0'), '9'].join('');
    records.push(trailer);
  } else {
    // Portaria 671 (REP-C)
    // Cabeçalho (tipo 1)
    const generationDateTime = formatDateTime671Full(new Date());
    const headerFields = [
      '000000000', // Campo 1: NSR
      '1', // Campo 2: Tipo do registro
      '1', // Campo 3: Tipo de identificador (CNPJ)
      employerCnpj, // Campo 4: CNPJ
      ''.padStart(14, '0'), // Campo 5: CNO/CAEPF
      employerName, // Campo 6: Razão social
      repNumber, // Campo 7: Número de fabricação
      formatDate671(startDate), // Campo 8: Data inicial
      formatDate671(endDate), // Campo 9: Data final
      generationDateTime, // Campo 10: Data e hora da geração
      '003', // Campo 11: Versão do leiaute
      '1', // Campo 12: Tipo de identificador do fabricante
      '98765432000195', // Campo 13: CNPJ do fabricante
      'REP-C EXEMPLO'.padEnd(30, ' '), // Campo 14: Modelo
      '', // Campo 15: CRC-16
    ];
    const headerWithoutCRC = headerFields.slice(0, -1).join('');
    headerFields[14] = calculateCRC16(headerWithoutCRC).padStart(4, '0');
    records.push(headerFields.join(''));

    // Marcações (tipo 3)
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateTimeStr = formatDateTime671(currentDate);

      const times = [entry1, exit1, entry2, exit2];
      for (let j = 0; j < times.length; j++) {
        const time = times[j];
        const record = [
          nsr.toString().padStart(9, '0'), // Campo 1: NSR
          '3', // Campo 2: Tipo do registro
          `${dateTimeStr}${time}:00-0300`, // Campo 3: Data e hora
          identifier, // Campo 4: CPF
          '', // Campo 5: CRC-16
        ];
        const recordWithoutCRC = record.slice(0, -1).join('');
        record[4] = calculateCRC16(recordWithoutCRC).padStart(4, '0');
        records.push(record.join(''));
        nsr++;
        recordCounts.type3++;
      }
    }

    // Trailer (tipo 9)
    const trailer = ['999999999', recordCounts.type2.toString().padStart(9, '0'), recordCounts.type3.toString().padStart(9, '0'), recordCounts.type4.toString().padStart(9, '0'), recordCounts.type5.toString().padStart(9, '0'), recordCounts.type6.toString().padStart(9, '0'), recordCounts.type7.toString().padStart(9, '0'), '9'].join('');
    records.push(trailer);
  }

  // Gerar arquivo
  const fileContent = records.join('\r\n');
  const blob = new Blob([fileContent], { type: 'text/plain;charset=iso-8859-1' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = idType === 'pis' ? 'AFD_PIS.txt' : `AFD${repNumber}${employerCnpj}REP_C.txt`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function formatDate1510(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

function formatTime1510(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}${minutes}`;
}

function formatDate671(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatDateTime671(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}T`;
}

function formatDateTime671Full(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-0300`;
}
