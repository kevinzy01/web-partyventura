// TEST de DateUtils - Verificación de lógica
console.log('=== TEST DE DATEUTILS ===');

// Test 1: addWeeks
console.log('\n--- Test addWeeks ---');
const testDate1 = new Date(2025, 10, 2); // 2 noviembre 2025 (sábado)
console.log('Fecha inicial:', testDate1.toISOString().split('T')[0], '(día', testDate1.getDay() + ')');

const plus1Week = DateUtils.addWeeks(testDate1, 1);
console.log('+1 semana:', plus1Week.toISOString().split('T')[0], '(día', plus1Week.getDay() + ')');
console.log('Diferencia días:', Math.round((plus1Week - testDate1) / (1000*60*60*24)));

const minus1Week = DateUtils.addWeeks(testDate1, -1);
console.log('-1 semana:', minus1Week.toISOString().split('T')[0], '(día', minus1Week.getDay() + ')');
console.log('Diferencia días:', Math.round((minus1Week - testDate1) / (1000*60*60*24)));

// Test 2: addMonths
console.log('\n--- Test addMonths ---');
const testDate2 = new Date(2025, 10, 1); // 1 noviembre 2025
console.log('Fecha inicial:', testDate2.toISOString().split('T')[0]);

const plus1Month = DateUtils.addMonths(testDate2, 1);
console.log('+1 mes:', plus1Month.toISOString().split('T')[0]);
console.log('Mes:', plus1Month.getMonth() + 1, 'Año:', plus1Month.getFullYear());

const minus1Month = DateUtils.addMonths(testDate2, -1);
console.log('-1 mes:', minus1Month.toISOString().split('T')[0]);
console.log('Mes:', minus1Month.getMonth() + 1, 'Año:', minus1Month.getFullYear());

// Test 3: startOfWeek
console.log('\n--- Test startOfWeek ---');
const dates = [
  new Date(2025, 10, 2),  // Domingo
  new Date(2025, 10, 3),  // Lunes
  new Date(2025, 10, 4),  // Martes
  new Date(2025, 10, 8),  // Sábado
];

dates.forEach(d => {
  const monday = DateUtils.startOfWeek(d);
  console.log(
    DateUtils.format(d, 'YYYY-MM-DD'), 
    '(' + DateUtils.format(d, 'dddd') + ')', 
    '→ Lunes:', 
    DateUtils.format(monday, 'YYYY-MM-DD'),
    '(día', monday.getDay() + ')'
  );
});

console.log('\n=== FIN TEST ===');
