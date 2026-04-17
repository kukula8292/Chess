class ChessHelper {
    constructor() {
        this.engine = new StockfishEngine();
        this.isAnalyzing = false;
        this.currentPosition = null;
        this.settings = {
            depth: 15,
            showArrows: true,
            showEval: true
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.createUI();
        this.setupEngine();
        this.startPositionMonitoring();
    }

    loadSettings() {
        chrome.storage.sync.get(['depth', 'showArrows', 'showEval'], (result) => {
            this.settings = {
                depth: result.depth || 15,
                showArrows: result.showArrows !== false,
                showEval: result.showEval !== false
            };
        });
    }

    createUI() {
        // Create analysis panel
        const panel = document.createElement('div');
        panel.id = 'chess-helper-panel';
        panel.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: white;
                border: 2px solid #333;
                border-radius: 8px;
                padding: 15px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                min-width: 200px;
                display: none;
            ">
                <h3 style="margin: 0 0 10px 0;">♟️ Analysis</h3>
                <div id="evaluation">Evaluation: --</div>
                <div id="best-move">Best Move: --</div>
                <div id="depth-info">Depth: --</div>
            </div>
        `;
        document.body.appendChild(panel);
        this.panel = panel.firstElementChild;
    }

    setupEngine() {
        this.engine.onInfo((data) => {
            if (!this.isAnalyzing) return;
            
            this.updateAnalysisDisplay(data);
        });

        this.engine.onBestMove((move) => {
            if (!this.isAnalyzing) return;
            
            this.highlightBestMove(move);
        });
    }

    updateAnalysisDisplay(data) {
        const evalEl = document.getElementById('evaluation');
        const depthEl = document.getElementById('depth-info');
        const moveEl = document.getElementById('best-move');

        if (data.eval !== undefined) {
            evalEl.textContent = `Evaluation: ${data.eval > 0 ? '+' : ''}${data.eval}`;
        } else if (data.mate !== undefined) {
            evalEl.textContent = `Mate in: ${data.mate}`;
        }

        if (data.depth) {
            depthEl.textContent = `Depth: ${data.depth}`;
        }

        if (data.pv && data.pv.length > 0) {
            moveEl.textContent = `Best Move: ${data.pv[0]}`;
        }
    }

    highlightBestMove(move) {
        if (!this.settings.showArrows) return;
        
        // Remove previous highlights
        this.clearHighlights();
        
        // Add arrow or highlight for best move
        this.drawArrow(move);
    }

    drawArrow(move) {
        // This is a simplified version - you'd need to adapt for specific sites
        const from = move.substring(0, 2);
        const to = move.substring(2, 4);
        
        // Find squares and draw arrow (implementation depends on chess site)
        this.highlightSquares(from, to);
    }

    highlightSquares(from, to) {
        // Generic square highlighting
        const squares = document.querySelectorAll(`[data-square="${from}"], [data-square="${to}"]`);
        squares.forEach(square => {
            square.style.boxShadow = 'inset 0 0 0 3px #ff6b6b';
        });
    }

    clearHighlights() {
        const highlighted = document.querySelectorAll('[style*="box-shadow"]');
        highlighted.forEach(el => {
            el.style.boxShadow = '';
        });
    }

    getCurrentPosition() {
        // This needs to be adapted for each chess site
        // For Lichess:
        if (window.location.hostname === 'lichess.org') {
            return this.getLichessPosition();
        }
        // For Chess.com:
        if (window.location.hostname === 'chess.com') {
            return this.getChessComPosition();
        }
        return null;
    }

    getLichessPosition() {
        // Extract FEN from Lichess
        try {
            const game = window.lichess?.analysis?.data;
            if (game && game.game && game.game.fen) {
                return game.game.fen;
            }
        } catch (e) {
            console.log('Could not get Lichess position');
        }
        return null;
    }

    getChessComPosition() {
        // Extract FEN from Chess.com
        try {
            // This is a simplified approach - Chess.com's structure may vary
            const fenElement = document.querySelector('[data-fen]');
            if (fenElement) {
                return fenElement.getAttribute('data-fen');
            }
        } catch (e) {
            console.log('Could not get Chess.com position');
        }
        return null;
    }

    startPositionMonitoring() {
        setInterval(() => {
            if (!this.isAnalyzing) return;
            
            const position = this.getCurrentPosition();
            if (position && position !== this.currentPosition) {
                this.currentPosition = position;
                this.analyzePosition(position);
            }
        }, 1000);
    }

    analyzePosition(fen) {
        this.engine.analyze(fen, this.settings.depth);
    }

    startAnalysis() {
        this.isAnalyzing = true;
        this.panel.style.display = 'block';
        
        const position = this.getCurrentPosition();
        if (position) {
            this.analyzePosition(position);
        }
    }

    stopAnalysis() {
        this.isAnalyzing = false;
        this.panel.style.display = 'none';
        this.engine.stop();
        this.clearHighlights();
    }
}

// Initialize when page loads
let chessHelper;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startAnalysis') {
        if (!chessHelper) {
            chessHelper = new ChessHelper();
        }
        chessHelper.startAnalysis();
    } else if (request.action === 'stopAnalysis') {
        if (chessHelper) {
            chessHelper.stopAnalysis();
        }
    }
});

// Auto-initialize if analysis was previously active
chrome.storage.sync.get(['isActive'], (result) => {
    if (result.isActive) {
        chessHelper = new ChessHelper();
        chessHelper.startAnalysis();
    }
});
