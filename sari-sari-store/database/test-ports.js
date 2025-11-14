const mysql = require('mysql2');

const ports = [3306, 3307, 3308, 3309];

ports.forEach(port => {
    const testConnection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        port: port,
        connectTimeout: 2000
    });

    testConnection.connect((err) => {
        if (err) {
            console.log(`❌ Port ${port}: Connection failed - ${err.code}`);
        } else {
            console.log(`✅ Port ${port}: Connection successful!`);
            testConnection.end();
        }
    });
});