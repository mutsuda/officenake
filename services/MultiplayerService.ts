
import Peer, { DataConnection } from 'peerjs';
import { GameState, Player, Food, NetworkMessage, Point } from '../types';
import { 
  WORLD_SIZE, INITIAL_SNAKE_LENGTH, BASE_SPEED, 
  SEGMENT_DISTANCE, FOOD_TYPES 
} from '../constants';
import { getBossCommentary } from './geminiService';

export class MultiplayerService {
  private peer: any = null;
  private connections: Record<string, DataConnection> = {};
  private gameState: GameState;
  private isHost: boolean = false;
  private myId: string = '';
  public roomCode: string = '';
  
  public onIdAssigned?: (id: string) => void;
  public onStateUpdate?: (state: GameState) => void;
  public onBossComment?: (text: string) => void;

  constructor() {
    console.log("📡 [Synergy Network] Initializing service...");
    this.gameState = {
      players: {},
      foods: this.generateFoods(50),
      worldWidth: WORLD_SIZE,
      worldHeight: WORLD_SIZE,
      status: 'lobby'
    };

    this.initializePeer();

    setInterval(() => {
      if (this.isHost && this.gameState.status === 'playing') {
        this.updateGameState();
        this.broadcast({ type: 'STATE_UPDATE', state: this.gameState });
      }
    }, 1000 / 30);
  }

  private initializePeer() {
    try {
      // Handle potential default export differences in CDNs
      const PeerJS = (Peer as any).default || Peer;
      
      if (!PeerJS || typeof PeerJS !== 'function') {
        console.warn("⚠️ [Synergy Network] PeerJS not yet available as a constructor. Retrying...");
        setTimeout(() => this.initializePeer(), 500);
        return;
      }

      this.peer = new PeerJS();
      
      this.peer.on('open', (id: string) => {
        console.log('✅ [Synergy Network] ID assigned:', id);
        this.myId = id;
        if (this.onIdAssigned) this.onIdAssigned(id);
      });

      this.peer.on('connection', (conn: any) => {
        console.log('🤝 [Synergy Network] Incoming connection:', conn.peer);
        if (this.isHost) {
          this.handleNewConnection(conn);
        }
      });

      this.peer.on('error', (err: any) => {
        console.error('❌ [Synergy Network] Peer error:', err.type, err);
      });

      this.peer.on('disconnected', () => {
        console.warn('🔌 [Synergy Network] Peer disconnected. Reconnecting...');
        this.peer.reconnect();
      });

    } catch (e) {
      console.error('❌ [Synergy Network] Critical initialization error:', e);
    }
  }

  public initHost(name: string, color: string) {
    console.log("👑 [Synergy Network] Promoting employee to Host...");
    this.isHost = true;
    this.roomCode = this.myId;
    this.gameState.status = 'playing';
    this.addPlayer(this.myId, name, color);
  }

  public joinRoom(hostId: string, name: string, color: string) {
    if (!this.peer) {
      console.error("❌ [Synergy Network] Join failed: Network not initialized.");
      return;
    }
    console.log(`🔗 [Synergy Network] Joining office: ${hostId}...`);
    this.isHost = false;
    this.roomCode = hostId;
    const conn = this.peer.connect(hostId);
    
    conn.on('open', () => {
      console.log('✅ [Synergy Network] Connected to Host.');
      this.connections[hostId] = conn;
      conn.send({ type: 'JOIN_REQUEST', name, color });
    });

    conn.on('data', (data: any) => {
      const msg = data as NetworkMessage;
      if (msg.type === 'STATE_UPDATE') {
        this.gameState = msg.state;
        if (this.onStateUpdate) this.onStateUpdate(this.gameState);
      } else if (msg.type === 'AI_COMMENT') {
        if (this.onBossComment) this.onBossComment(msg.text);
      }
    });

    conn.on('close', () => {
      console.warn('❌ [Synergy Network] Host connection closed.');
    });
  }

  private handleNewConnection(conn: DataConnection) {
    conn.on('data', async (data: any) => {
      const msg = data as NetworkMessage;
      if (msg.type === 'JOIN_REQUEST') {
        console.log(`👤 [Synergy Network] Adding player: ${msg.name}`);
        this.addPlayer(conn.peer, msg.name, msg.color);
        this.connections[conn.peer] = conn;
        
        const comment = await getBossCommentary("New hire joined", msg.name, 0);
        this.broadcast({ type: 'AI_COMMENT', text: comment });
        if (this.onBossComment) this.onBossComment(comment);
      } else if (msg.type === 'INPUT_UPDATE') {
        if (this.gameState.players[conn.peer]) {
          this.gameState.players[conn.peer].angle = msg.angle;
        }
      }
    });
  }

  private addPlayer(id: string, name: string, color: string) {
    const startX = Math.random() * (WORLD_SIZE - 200) + 100;
    const startY = Math.random() * (WORLD_SIZE - 200) + 100;
    const angle = Math.random() * Math.PI * 2;

    const segments: Point[] = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      segments.push({
        x: startX - Math.cos(angle) * i * SEGMENT_DISTANCE,
        y: startY - Math.sin(angle) * i * SEGMENT_DISTANCE
      });
    }

    this.gameState.players[id] = {
      id, name, color, score: 0, segments, angle, speed: BASE_SPEED, isDead: false
    };
  }

  private updateGameState() {
    (Object.values(this.gameState.players) as Player[]).forEach(async player => {
      if (player.isDead) return;

      const head = player.segments[0];
      const newHead = {
        x: head.x + Math.cos(player.angle) * player.speed,
        y: head.y + Math.sin(player.angle) * player.speed
      };

      // Border collision
      if (newHead.x < 0 || newHead.x > WORLD_SIZE || newHead.y < 0 || newHead.y > WORLD_SIZE) {
        player.isDead = true;
        const comment = await getBossCommentary("Player hit wall", player.name, player.score);
        this.broadcast({ type: 'AI_COMMENT', text: comment });
        return;
      }

      // Snake collision
      for (const other of (Object.values(this.gameState.players) as Player[])) {
        if (other.isDead) continue;
        const startIdx = other.id === player.id ? 5 : 0; 
        for (let i = startIdx; i < other.segments.length; i++) {
          const seg = other.segments[i];
          const dist = Math.hypot(newHead.x - seg.x, newHead.y - seg.y);
          if (dist < 15) {
            player.isDead = true;
            const comment = await getBossCommentary("Employee collision", player.name, player.score);
            this.broadcast({ type: 'AI_COMMENT', text: comment });
            return;
          }
        }
      }

      // Movement and growth logic
      const newSegments = [newHead];
      let lastPos = newHead;
      for (let i = 0; i < player.segments.length - 1; i++) {
        const current = player.segments[i];
        const dist = Math.hypot(lastPos.x - current.x, lastPos.y - current.y);
        if (dist >= SEGMENT_DISTANCE) {
          newSegments.push(current);
          lastPos = current;
        }
      }
      
      while (newSegments.length < player.segments.length) {
        newSegments.push(player.segments[newSegments.length]);
      }
      player.segments = newSegments.slice(0, Math.floor(INITIAL_SNAKE_LENGTH + player.score / 5));

      // Food collection
      this.gameState.foods = this.gameState.foods.filter(food => {
        const dist = Math.hypot(newHead.x - food.x, newHead.y - food.y);
        if (dist < 25) {
          player.score += food.value;
          return false;
        }
        return true;
      });

      if (this.gameState.foods.length < 50) {
        this.gameState.foods.push(...this.generateFoods(1));
      }
    });

    if (this.onStateUpdate) this.onStateUpdate(this.gameState);
  }

  private generateFoods(count: number): Food[] {
    const types: (keyof typeof FOOD_TYPES)[] = ['coffee', 'donut', 'stapler', 'laptop'];
    return Array.from({ length: count }).map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * WORLD_SIZE,
      y: Math.random() * WORLD_SIZE,
      type: types[Math.floor(Math.random() * types.length)],
      value: 10
    }));
  }

  private broadcast(msg: NetworkMessage) {
    Object.values(this.connections).forEach(conn => {
      if (conn.open) conn.send(msg);
    });
  }

  public sendInput(angle: number) {
    if (this.isHost) {
      if (this.gameState.players[this.myId]) {
        this.gameState.players[this.myId].angle = angle;
      }
    } else {
      const hostConn = this.connections[this.roomCode];
      if (hostConn && hostConn.open) {
        hostConn.send({ type: 'INPUT_UPDATE', angle });
      }
    }
  }

  public getPeerId() { return this.myId; }
}
