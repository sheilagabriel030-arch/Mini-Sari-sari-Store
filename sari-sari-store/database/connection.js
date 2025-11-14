const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'lMPjS2i@(xw90vhh', // Replace with your MariaDB password
    database: 'sari_sari_store',
    port: 3307, // MariaDB port in WAMPP
    connectTimeout: 60000,
    charset: 'utf8mb4'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MariaDB database:', err.message);
        console.log('\n🔧 Please check:');
        console.log('1. Is MariaDB running in WAMPP?');
        console.log('2. Is the password correct?');
        console.log('3. Is the port correct (3307)?');
        return;
    }
    console.log('✅ Connected to MariaDB database successfully!');
    console.log('📊 Database: sari_sari_store');
});

connection.on('error', (err) => {
    console.error('MariaDB connection error:', err.message);
});

module.exports = connection;