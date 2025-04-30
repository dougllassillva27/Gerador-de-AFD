<?php
include_once $_SERVER['DOCUMENT_ROOT'] . '/inc/versao.php';
$base = '/Secullum/Gerador-de-AFD'; // sem /public_html
?>
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Gerador de Arquivo AFD Portaria 1510/671" />
    <meta name="keywords" content="AFD, portaria 1510, portaria 671, batidas" />
    <meta name="author" content="Douglas Silva" />
    <link rel="icon" type="image/x-icon" href="<?= versao("$base/favicon.ico?v=1") ?>" />
    <title>Gerador de Arquivo AFD Portaria 1510/671</title>
    <script src="https://cdn.jsdelivr.net/npm/js-sha256@0.9.0/src/sha256.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="<?= versao("$base/style.css") ?>">
  </head>
  <body>
    <div class="card">
      <h1>Gerador de Arquivo AFD Portaria 1510/671</h1>
      <form id="afdForm">
        <div class="form-group">
          <label for="idType">Tipo de Identificador</label>
          <select id="idType" onchange="updateIdLabel()">
            <option value="pis">PIS (Portaria 1510)</option>
            <option value="cpf">CPF (Portaria 671 - REP-C)</option>
          </select>
        </div>

        <div class="form-group">
          <label id="idLabel" for="identifier">PIS do Empregado</label>
          <input type="text" id="identifier" placeholder="Digite o PIS ou CPF" required />
        </div>

        <div class="form-group">
          <label for="employerName">Razão Social ou Nome do Empregador</label>
          <input type="text" id="employerName" value="EMPRESA EXEMPLO LTDA" required />
        </div>

        <div class="form-group">
          <label for="employerCnpj">CNPJ do Empregador</label>
          <input type="text" id="employerCnpj" value="12345678000195" required />
        </div>

        <div class="form-group">
          <label for="repNumber">Número de Fabricação do REP (para REP-C)</label>
          <input type="text" id="repNumber" value="12345678901234567" required />
        </div>

        <div class="form-group">
          <label for="startDate">Data Inicial dos Registros</label>
          <input type="date" id="startDate" value="2025-01-01" required />
        </div>

        <div class="form-group">
          <label for="days">Quantidade de Dias</label>
          <input type="number" id="days" min="1" value="1" required />
        </div>

        <div class="time-grid">
          <div class="form-group">
            <label for="entry1">Hora Entrada 1 (HH:MM)</label>
            <input type="time" id="entry1" value="08:00" required />
          </div>
          <div class="form-group">
            <label for="exit1">Hora Saída 1 (HH:MM)</label>
            <input type="time" id="exit1" value="12:00" required />
          </div>
          <div class="form-group">
            <label for="entry2">Hora Entrada 2 (HH:MM)</label>
            <input type="time" id="entry2" value="13:00" required />
          </div>
          <div class="form-group">
            <label for="exit2">Hora Saída 2 (HH:MM)</label>
            <input type="time" id="exit2" value="17:00" required />
          </div>
        </div>

        <button type="submit">Gerar Arquivo AFD</button>
      </form>
    </div>    
  </body>
  <script src="<?= versao("$base/script.js") ?>"></script>
</html>