function updateIdLabel() {
  const idType = document.getElementById('idType').value;
  const idLabel = document.getElementById('idLabel');
  idLabel.textContent = idType === 'pis' ? 'PIS do Empregado' : 'CPF do Empregado';
}

document.getElementById('afdForm').addEventListener('submit', function (e) {
  e.preventDefault();
  generateAfd();
});

function generateAfd() {
  const idType = document.getElementById('idType').value;
  const identifier = document.getElementById('identifier').value.padStart(idType === 'pis' ? 12 : 14, '0');
  const employerName = document.getElementById('employerName').value.padEnd(150, ' ');
  const employerCnpj = document.getElementById('employerCnpj').value.padStart(14, '0');
  const repNumber = document.getElementById('repNumber').value.padStart(17, '0');
  const days = parseInt(document.getElementById('days').value);
  const entry1 = document.getElementById('entry1').value.replace(':', '');
  const exit1 = document.getElementById('exit1').value.replace(':', '');
  const entry2 = document.getElementById('entry2').value.replace(':', '');
  const exit2 = document.getElementById('exit2').value.replace(':', '');

  let nsr = 1;
  let records = [];
  let recordCounts = { type2: 0, type3: 0, type4: 0, type5: 0, type6: 0, type7: 0 };

  // Data inicial e final
  const startDate = new Date('2025-01-01');
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
    const header = [
      '000000000', // Campo 1
      '1', // Campo 2
      '1', // Campo 3 (CNPJ)
      employerCnpj, // Campo 4
      ''.padStart(14, '0'), // Campo 5 (CNO/CAEPF)
      employerName, // Campo 6
      repNumber, // Campo 7
    ].join('');
    records.push(header);

    // Marcações (tipo 7)
    let previousHash = '';
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateTimeStr = formatDateTime671(currentDate);

      const times = [entry1, exit1, entry2, exit2];
      for (let j = 0; j < times.length; j++) {
        const time = times[j];
        const record = [
          nsr.toString().padStart(9, '0'), // Campo 1
          '7', // Campo 2
          `${dateTimeStr}${time}:00-0300`, // Campo 3
          identifier.padStart(12, '0'), // Campo 4
          `${dateTimeStr}${time}:00-0300`, // Campo 5
          '01', // Campo 6 (aplicativo mobile)
          '0', // Campo 7 (on-line)
          '', // Campo 8 (hash, será calculado)
        ];

        // Calcular hash SHA-256
        const hashInput = record.slice(0, -1).join('') + previousHash;
        const hash = sha256(hashInput).toUpperCase();
        record[7] = hash.padEnd(64, ' ');
        previousHash = hash;

        records.push(record.join(''));
        nsr++;
        recordCounts.type7++;
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

function formatDateTime671(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}T`;
}
