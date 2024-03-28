const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(bodyParser.json());

// Rota para receber os dados de monitoramento
app.post('/api/dados-monitoramento', (req, res) => {
    const dadosRecebidos = req.body;
    console.log('Dados recebidos do cliente:', dadosRecebidos);
    res.send('Dados recebidos com sucesso pelo servidor.');
});

// Rota para receber mensagens do chat
io.on('connection', (socket) => {
    console.log('Usuário conectado ao chat');

    socket.on('chat message', (msgObj) => {
        const { nomeUsuario, mensagem } = msgObj; // Extrai nome do usuário e mensagem do objeto
        console.log(`Mensagem recebida do cliente ${nomeUsuario}: ${mensagem}`);
        io.emit('chat message', { nomeUsuario, mensagem }); // Enviar mensagem para todos os clientes conectados com nome do usuário
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado do chat');
    });
});

// Iniciar o servidor na porta 3000
http.listen(3000, () => {
    console.log('Server rodando na porta 3000')
});
