const express = require('express');
const app = express();
app.use(express.json());

// Diccionario para guardar las salas: { "ECZN": { ip: "...", port: 8910 } }
const salas = {};

// 1. CREAR SALA (El Host la registra)
app.post('/crear_sala', (req, res) => {
    const { codigo, puerto } = req.body;
    
    // Obtenemos la IP real a través de los proxies de Render
    let ipHost = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Si viene con múltiples IPs separadas por comas (por Cloudflare), cogemos la primera (la real del usuario)
    if (ipHost && ipHost.includes(',')) {
        ipHost = ipHost.split(',')[0].trim();
    }
    
    // Limpiamos prefijos de IPv6 si los hubiera
    if (ipHost.startsWith('::ffff:')) {
        ipHost = ipHost.replace('::ffff:', '');
    }

    if (!codigo) {
        return res.status(400).json({ error: "Falta el código de sala" });
    }

    salas[codigo] = {
        ip: ipHost,
        port: puerto || 8910
    };

    console.log(`Sala creada: [${codigo}] con IP: ${ipHost}:${puerto}`);
    res.json({ success: true, mensaje: "Sala registrada correctamente" });
});

// 2. UNIRSE A SALA (El cliente pide la IP por el código)
app.get('/unirse_sala/:codigo', (req, res) => {
    const codigo = req.params.codigo.toUpperCase();
    const sala = salas[codigo];

    if (sala) {
        console.log(`Usuario encontrado para la sala [${codigo}]. Devolviendo IP: ${sala.ip}`);
        res.json({ ip: sala.ip, port: sala.port });
    } else {
        res.status(404).json({ error: "Sala no encontrada o código incorrecto" });
    }
});

// 3. PUERTO DINÁMICO PARA RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de matchmaking corriendo en el puerto ${PORT}`);
});