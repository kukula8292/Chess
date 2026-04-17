// Stockfish Web Worker wrapper
class StockfishEngine {
    constructor() {
        this.worker = null;
        this.isReady = false;
        this.callbacks = {};
        this.init();
    }

    init() {
        // Load Stockfish from CDN
        this.worker = new Worker('https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish.js');
        
        this.worker.onmessage = (e) => {
            const message = e.data;
            
            if (message === 'uciok') {
                this.isReady = true;
                this.send('isready');
            }
            
            if (message === 'readyok') {
                if (this.callbacks.ready) this.callbacks.ready();
            }
            
            if (message.startsWith('bestmove')) {
                const move = message.split(' ')[1];
                if (this.callbacks.bestmove) this.callbacks.bestmove(move);
            }
            
            if (message.startsWith('info depth')) {
                this.parseInfo(message);
            }
        };

        this.send('uci');
    }

    send(command) {
        if (this.worker) {
            this.worker.postMessage(command);
        }
    }

    parseInfo(info) {
        const parts = info.split(' ');
        const data = {};
        
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === 'depth') data.depth = parseInt(parts[i + 1]);
            if (parts[i] === 'cp') data.eval = parseInt(parts[i + 1]) / 100;
            if (parts[i] === 'mate') data.mate = parseInt(parts[i + 1]);
            if (parts[i] === 'pv') {
                data.pv = parts.slice(i + 1);
                break;
            }
        }
        
        if (this.callbacks.info) this.callbacks.info(data);
    }

    analyze(fen, depth = 15) {
        this.send(`position fen ${fen}`);
        this.send(`go depth ${depth}`);
    }

    stop() {
        this.send('stop');
    }

    onReady(callback) {
        this.callbacks.ready = callback;
    }

    onBestMove(callback) {
        this.callbacks.bestmove = callback;
    }

    onInfo(callback) {
        this.callbacks.info = callback;
    }
}

// Make it globally available
window.StockfishEngine = StockfishEngine;
