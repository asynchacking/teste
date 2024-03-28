const axios = require('axios');
const os = require('os');
const dns = require('dns');
const si = require('systeminformation');
const socketio = require('socket.io-client');

// Função para obter informações sobre o nome do usuário
function obterNomeUsuario() {
    return os.userInfo().username;
}

// Função para obter informações sobre a rede Wi-Fi
async function obterNomeRedeWifi() {
    try {
        const redesWifi = await si.wifiNetworks();
        const redeAtual = redesWifi.find((rede) => rede.active === true);
        return redeAtual ? redeAtual.ssid : 'Não conectado';
    } catch (error) {
        console.error('Erro ao obter nome da rede Wi-Fi:', error.message);
        return 'Erro ao obter nome da rede Wi-Fi';
    }
}

// Função para obter informações sobre o espaço livre em disco
async function obterEspacoLivreDisco() {
    const infoDisco = await si.fsSize();
    const espacoLivre = infoDisco[0].size - infoDisco[0].used;
    return espacoLivre / (1024 * 1024 * 1024);
}

// Função para obter a porcentagem de bateria (caso seja um notebook)
async function obterPorcentagemBateria() {
    const bateria = await si.battery();
    return bateria ? bateria.percent : 'Não disponível';
}

// Função para obter informações sobre a rede
function obterInformacoesRede() {
    const interfacesRede = os.networkInterfaces();
    const informacoes = [];

    for (const nomeInterface in interfacesRede) {
        interfacesRede[nomeInterface].forEach((iface) => {
            if (!iface.internal && iface.family === 'IPv4') {
                informacoes.push({
                    nomeInterface,
                    enderecoIP: iface.address,
                    mascaraSubrede: iface.netmask,
                });
            }
        });
    }

    return informacoes;
}

// Função para obter a quantidade de aparelhos conectados
async function obterQuantidadeAparelhosConectados() {
    const informacoesRede = obterInformacoesRede();
    const ips = informacoesRede.map((info) => info.enderecoIP);

    const hosts = await Promise.allSettled(
        ips.map(async (ip) => {
            try {
                const result = await dns.promises.reverse(ip);
                return result.length > 0 ? result[0] : null;
            } catch (error) {
                return null;
            }
        })
    );

    const aparelhosConectados = hosts.filter((host) => host !== null).length;
    return aparelhosConectados;
}

// Função para obter o endereço IP externo (IP público)
async function obterEnderecoIPExterno() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        return response.data.ip;
    } catch (error) {
        console.error('Erro ao obter o endereço IP externo:', error.message);
        return null;
    }
}

// Função para obter o tempo de atividade do sistema
function obterTempoAtividadeSistema() {
    const tempoAtividadeSegundos = os.uptime();
    const tempoAtividadeMinutos = Math.floor(tempoAtividadeSegundos / 60);
    return tempoAtividadeMinutos;
}

// Função principal para enviar dados para o servidor
async function enviarDadosServidor() {
    try {
        const quantidadeAparelhosConectados = await obterQuantidadeAparelhosConectados();
        const informacoesRede = obterInformacoesRede();
        const enderecoIPExterno = await obterEnderecoIPExterno();
        const nomeRedeWifi = await obterNomeRedeWifi();
        const espacoLivreDisco = await obterEspacoLivreDisco();
        const porcentagemBateria = await obterPorcentagemBateria();
        const tempoAtividade = obterTempoAtividadeSistema();
        const nomeUsuario = obterNomeUsuario();

        const dadosParaEnviar = {
            nomeUsuario,
            quantidadeAparelhosConectados,
            informacoesRede,
            enderecoIPExterno,
            nomeRedeWifi,
            espacoLivreDisco,
            porcentagemBateria,
            tempoAtividade,
        };

        await axios.post('https://teste-j94x.onrender.com:3000/api/dados-monitoramento', dadosParaEnviar);
        console.log('Dados enviados com sucesso para o servidor.');
    } catch (error) {
        console.error('Erro ao enviar dados para o servidor:', error);
    }
}

// Chamar a função principal para enviar dados
enviarDadosServidor();

