const express = require('express');
const app = express();
app.use(express.json());

// Diccionario en memoria para guardar las salas activas
// Clave: Código de sala (ej. "AB12") -> Valor: { ip, port, timestamp }
const salas = new Map();

// 1. Endpoint para que el anfitrión registre su sala
app.post('/crear_sala', (req, res) => {
    const { codigo, puerto } = req.body;
    
    if (!codigo || !puerto) {
        return res.status(400).json({ error: "Faltan datos (codigo o puerto)" });
    }

    // Obtenemos la IP pública automáticamente desde la petición HTTP
    // (req.ip o req.headers['x-forwarded-for'] si está detrás de un proxy como Render/Railway)
    const ipPublica = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    salas.set(codigo.toUpperCase(), {
        ip: ipPublica.replace(/^.*:/, ''), // Limpia el formato IPv6 si viene con él (::ffff:)
        port: puerto,
        tiempo: Date.now()
    });

    console.log(`Sala creada: [${codigo.toUpperCase()}] en ${ipPublica}:${puerto}`);
    res.json({ success: true });
});

// 2. Endpoint para que el invitado consulte la IP de una sala por su código
app.get('/unirse_sala/:codigo', (req, res) => {
    const codigo = req.params.codigo.toUpperCase();
    const sala = salas.get(codigo);

    if (!sala) {
        return res.status(404).json({ error: "Sala no encontrada o código incorrecto" });
    }

    res.json({ ip: sala.ip, port: sala.port });
});

// Limpieza automática de salas antiguas cada 30 minutos (opcional pero recomendado)
setInterval(() => {
    const ahora = Date.now();
    for (const [codigo, sala] of salas.entries()) {
        if (ahora - sala.tiempo > 1000 * 60 * 60) { // 1 hora de vida máxima
            salas.delete(codigo);
        }
    }
}, 1000 * 60 * 30);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de matchmaking corriendo en el puerto ${PORT}`);
});