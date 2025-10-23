// Script para cambiar entre modo development y production fácilmente
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../frontend/src/js/modules/config.js');

// Leer el modo actual
const configContent = fs.readFileSync(configPath, 'utf8');
const currentMode = configContent.match(/const MODE = '(.*?)'/)[1];

console.log(`\n🔧 Modo actual: ${currentMode}\n`);

if (process.argv[2] === 'production') {
  // Cambiar a production
  const newContent = configContent.replace(
    /const MODE = 'development'/,
    "const MODE = 'production'"
  );
  fs.writeFileSync(configPath, newContent);
  console.log('✅ Cambiado a modo PRODUCTION');
  console.log('⚠️  Recuerda actualizar la URL de ngrok en config.js\n');
} else if (process.argv[2] === 'development') {
  // Cambiar a development
  const newContent = configContent.replace(
    /const MODE = 'production'/,
    "const MODE = 'development'"
  );
  fs.writeFileSync(configPath, newContent);
  console.log('✅ Cambiado a modo DEVELOPMENT');
  console.log('📍 Usando http://localhost:5000\n');
} else {
  console.log('❌ Uso: node switch-mode.js [production|development]');
  console.log('\nEjemplos:');
  console.log('  node switch-mode.js production   → Cambiar a modo production (para ngrok)');
  console.log('  node switch-mode.js development  → Cambiar a modo development (para localhost)\n');
}
