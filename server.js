const express = require('express');
const app = express();
app.use(express.json());

const salas = {};

app.post('/crear_sala', (req, res) => {
    const { codigo, puerto } = req.body;
    
    // Obtenemos automáticamente tu IP pública real a través de la petición que llega a Render
    let ipHost = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    if (ipHost && ipHost.includes(',')) {
        ipHost = ipHost.split(',')[0].trim();
    }
    if (ipHost.startsWith('::ffff:')) {
        ipHost = ipHost.replace('::ffff:', '');
    }

    const puertoLimpio = parseInt(puerto, 10) || 8910;

    if (!codigo) {
        return res.status(400).json({ error: "Falta el código de sala" });
    }

    salas[codigo] = {
        ip: ipHost,
        port: puertoLimpio
    };

    console.log(`Sala creada: [${codigo}] con IP pública guardada: ${ipHost}:${puertoLimpio}`);
    res.json({ success: true, mensaje: "Sala registrada correctamente" });
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de matchmaking corriendo en el puerto ${PORT}`);
});