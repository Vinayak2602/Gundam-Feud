/// <reference types="@cloudflare/workers-types" />

interface Env {
  ROOMS: DurableObjectNamespace;
  ROOM_DIRECTORY: DurableObjectNamespace;
}

type Role = "host" | "player" | "display" | "buzzer-screen";

interface ClientAttachment {
  id?: string;
  role?: Role;
  room: string;
}

interface WSEvent {
  action?: string;
  data?: any;
  file?: string;
  lang?: string;
  room?: string;
  name?: string;
  host?: boolean;
  id?: string;
  hostPassword?: string;
  session?: string;
  team?: number | null;
}

interface RegisteredPlayer {
  start?: string;
  latencies?: number[];
  team: number | null;
  latency?: number;
  name: string;
  hidden?: boolean;
}

interface Game {
  room: string;
  registeredPlayers: Record<string, RegisteredPlayer>;
  host: { id: string };
  buzzed: Array<{ time: number; id?: string; team?: number | null }>;
  settings: {
    logo_url: string | null;
    title_music_url: string | null;
    hide_questions: boolean;
    theme: string;
    final_round_title: string | null;
    player_buzzer_sound: boolean;
    first_buzzer_sound_only: boolean;
    hide_join_info: boolean;
  };
  teams: Array<{ name: string; points: number; mistakes: number }>;
  title: boolean;
  title_text: string;
  point_tracker: number[];
  round: number;
  rounds: Array<{
    answers: Array<{ trig: boolean; ans: string; pnt: number }>;
    multiply: number;
    question: string;
  }>;
  is_sudden_death: boolean;
  winner_team: number | null;
  game_over: boolean;
  is_final_round: boolean;
  is_final_second: boolean;
  hide_first_round: boolean;
  final_round: any[];
  final_round_2: any[];
  final_round_timers: number[];
  tick: number;
  round_start_time: number;
}

const ROOM_GRACE_MS = 5 * 60 * 1000;
const ROOM_CODE_LENGTH = 4;
const ROOM_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GUNDAM_GAME = {
  rounds: [
    {
      question: "Name something Gundam fans argue about endlessly.",
      answers: [
        { ans: "Which Gundam is the strongest?", pnt: 31 },
        { ans: "UC vs. AU", pnt: 22 },
        { ans: "Best protagonist", pnt: 16 },
        { ans: "Best Char / rival", pnt: 12 },
        { ans: "Best mobile suit design", pnt: 9 },
        { ans: "Dub vs. sub", pnt: 6 },
        { ans: "Best series ending", pnt: 4 },
      ],
      multiply: 1,
    },
    {
      question: "Name a Gundam mobile suit that instantly gets a fan excited.",
      answers: [
        { ans: "RX-78-2 Gundam", pnt: 28 },
        { ans: "Nu Gundam", pnt: 18 },
        { ans: "Zeta Gundam", pnt: 16 },
        { ans: "Unicorn Gundam", pnt: 14 },
        { ans: "Wing Zero", pnt: 10 },
        { ans: "Barbatos", pnt: 8 },
        { ans: "Sazabi", pnt: 6 },
      ],
      multiply: 1,
    },
    {
      question: "Name something you might say after seeing a ridiculously expensive Gunpla.",
      answers: [
        { ans: "That's too expensive!", pnt: 30 },
        { ans: "I'll buy it anyway.", pnt: 24 },
        { ans: "Where's the sale?", pnt: 15 },
        { ans: "I need another shelf.", pnt: 12 },
        { ans: "My partner will kill me.", pnt: 8 },
        { ans: "Is this P-Bandai?", pnt: 7 },
        { ans: "Take my money.", pnt: 4 },
      ],
      multiply: 1,
    },
    {
      question: "Name a Gundam character fans love to quote or imitate.",
      answers: [
        { ans: "Char Aznable", pnt: 28 },
        { ans: "Amuro Ray", pnt: 20 },
        { ans: "Bright Noa", pnt: 16 },
        { ans: "Quattro Bajeena", pnt: 12 },
        { ans: "Duo Maxwell", pnt: 10 },
        { ans: "Kamille Bidan", pnt: 8 },
        { ans: "Master Asia", pnt: 6 },
      ],
      multiply: 1,
    },
    {
      question: "Name something that makes a Gundam battle unforgettable.",
      answers: [
        { ans: "Amazing music", pnt: 25 },
        { ans: "A great rival fight", pnt: 21 },
        { ans: "Newtype powers", pnt: 16 },
        { ans: "A huge explosion", pnt: 14 },
        { ans: "Iconic mobile suit", pnt: 10 },
        { ans: "Emotional stakes", pnt: 8 },
        { ans: "A dramatic speech", pnt: 6 },
      ],
      multiply: 2,
    },
    {
      question: "Name a Gundam series a newcomer might be told to watch first.",
      answers: [
        { ans: "Mobile Suit Gundam", pnt: 25 },
        { ans: "Iron-Blooded Orphans", pnt: 21 },
        { ans: "Gundam 00", pnt: 17 },
        { ans: "The Witch from Mercury", pnt: 15 },
        { ans: "Gundam Unicorn", pnt: 10 },
        { ans: "Gundam Wing", pnt: 7 },
        { ans: "G GUNDAM", pnt: 5 },
      ],
      multiply: 2,
    },
    {
      question: "Name something a Gundam pilot is likely to experience.",
      answers: [
        { ans: "Trauma", pnt: 29 },
        { ans: "A rival", pnt: 18 },
        { ans: "A dramatic cockpit speech", pnt: 15 },
        { ans: "Losing a friend", pnt: 13 },
        { ans: "Newtype awakening", pnt: 10 },
        { ans: "A broken mobile suit", pnt: 8 },
        { ans: "Questionable military orders", pnt: 7 },
      ],
      multiply: 3,
    },
  ],
  final_round: [
    {
      question: "Name a Gundam mobile suit fans instantly recognize.",
      answers: [
        ["RX-78-2 Gundam", 42],
        ["Zaku II", 31],
        ["Wing Zero", 18],
        ["Unicorn Gundam", 15],
        ["Barbatos", 11],
      ],
    },
    {
      question: "Name something Gunpla builders always need more of.",
      answers: [
        ["Shelf space", 39],
        ["Nippers", 25],
        ["Panel liner", 18],
        ["Decals", 12],
        ["Time", 8],
      ],
    },
    {
      question: "Name a reason a model kit backlog gets bigger.",
      answers: [
        ["Sales", 38],
        ["Preorders", 27],
        ["Limited releases", 20],
        ["No time to build", 14],
        ["New grade announced", 9],
      ],
    },
    {
      question: "Name a word mecha fans use a lot.",
      answers: [
        ["Mobile suit", 44],
        ["Newtype", 29],
        ["Gunpla", 23],
        ["Colony", 13],
        ["Beam saber", 10],
      ],
    },
  ],
  final_round_timers: [20, 25],
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

function randomId() {
  return crypto.randomUUID();
}

function randomRoomCode() {
  let code = "";
  const values = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(values);
  for (const value of values) {
    code += ROOM_LETTERS[value % ROOM_LETTERS.length];
  }
  return code;
}

function randomHostPassword() {
  const alphabet = "123456789abcdefghijklmnopqrstuvwxyz";
  const values = new Uint8Array(6);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function now() {
  return Date.now();
}

function createGame(room: string): Game {
  return {
    room,
    registeredPlayers: {},
    host: { id: "" },
    buzzed: [],
    settings: {
      logo_url: null,
      title_music_url: null,
      hide_questions: true,
      theme: "default",
      final_round_title: null,
      player_buzzer_sound: false,
      first_buzzer_sound_only: false,
      hide_join_info: false,
    },
    teams: [
      { name: "Zeon", points: 0, mistakes: 0 },
      { name: "Earth Federation", points: 0, mistakes: 0 },
    ],
    title: true,
    title_text: "Gundam Feud",
    point_tracker: GUNDAM_GAME.rounds.map(() => 0),
    round: 0,
    rounds: clone(GUNDAM_GAME.rounds).map((round) => ({
      ...round,
      answers: round.answers.map((answer) => ({ ...answer, trig: false })),
    })),
    is_sudden_death: false,
    winner_team: null,
    game_over: false,
    is_final_round: false,
    is_final_second: false,
    hide_first_round: false,
    final_round: clone(GUNDAM_GAME.final_round),
    final_round_2: clone(GUNDAM_GAME.final_round),
    final_round_timers: [...GUNDAM_GAME.final_round_timers],
    tick: now(),
    round_start_time: now(),
  };
}

async function reserveRoom(env: Env) {
  const id = env.ROOM_DIRECTORY.idFromName("global");
  const response = await env.ROOM_DIRECTORY.get(id).fetch("https://directory/reserve", { method: "POST" });
  if (!response.ok) {
    throw new Error(`Unable to reserve room: ${response.status}`);
  }
  return (await response.json()) as { room: string };
}

async function releaseRoom(env: Env, room: string) {
  const id = env.ROOM_DIRECTORY.idFromName("global");
  await env.ROOM_DIRECTORY.get(id).fetch(`https://directory/release/${room}`, { method: "POST" });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "gundam-feud-realtime" });
    }

    if (url.pathname !== "/api/ws") {
      return new Response("Not found", { status: 404 });
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    let room = url.searchParams.get("room")?.toUpperCase() ?? "";
    if (!room && url.searchParams.get("mode") === "host") {
      room = (await reserveRoom(env)).room;
      url.searchParams.set("room", room);
    }

    if (!room || room.length !== ROOM_CODE_LENGTH) {
      return new Response("Missing or invalid room code", { status: 400 });
    }

    const id = env.ROOMS.idFromName(room);
    return env.ROOMS.get(id).fetch(new Request(url, request));
  },
};

export class RoomDirectory {
  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const rooms = ((await this.state.storage.get<Record<string, number>>("rooms")) ?? {}) as Record<string, number>;
    const currentTime = now();

    for (const [room, expiresAt] of Object.entries(rooms)) {
      if (expiresAt > 0 && expiresAt <= currentTime) {
        delete rooms[room];
      }
    }

    if (url.pathname === "/reserve" && request.method === "POST") {
      for (let attempt = 0; attempt < 50; attempt++) {
        const room = randomRoomCode();
        if (!rooms[room]) {
          rooms[room] = 0;
          await this.state.storage.put("rooms", rooms);
          return json({ room });
        }
      }
      return json({ error: "room_code_exhausted" }, { status: 503 });
    }

    const releaseMatch = url.pathname.match(/^\/release\/([A-Z]{4})$/);
    if (releaseMatch && request.method === "POST") {
      delete rooms[releaseMatch[1]];
      await this.state.storage.put("rooms", rooms);
      return json({ ok: true });
    }

    const expireMatch = url.pathname.match(/^\/expire\/([A-Z]{4})$/);
    if (expireMatch && request.method === "POST") {
      rooms[expireMatch[1]] = currentTime + ROOM_GRACE_MS;
      await this.state.storage.put("rooms", rooms);
      return json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  }
}

export class RoomObject {
  constructor(
    private state: DurableObjectState,
    private env: Env
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const room = url.searchParams.get("room")?.toUpperCase();
    if (!room) {
      return new Response("Missing room", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.serializeAttachment({ room } satisfies ClientAttachment);
    this.state.acceptWebSocket(server);
    await this.state.storage.put("room", room);
    await this.state.storage.delete("closeAt");
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") {
      return;
    }

    let event: WSEvent;
    try {
      event = JSON.parse(message);
    } catch (error) {
      this.send(ws, { action: "error", code: "errors.parse_error", message: String(error) });
      return;
    }

    try {
      await this.handleEvent(ws, event);
    } catch (error) {
      this.send(ws, { action: "error", code: "errors.server_error", message: String(error) });
    }
  }

  async webSocketClose(ws: WebSocket) {
    await this.scheduleCloseIfEmpty(ws);
  }

  async webSocketError(ws: WebSocket) {
    await this.scheduleCloseIfEmpty(ws);
  }

  async alarm() {
    const closeAt = await this.state.storage.get<number>("closeAt");
    if (!closeAt || closeAt > now()) {
      return;
    }

    for (const socket of this.state.getWebSockets()) {
      socket.close(1000, "Room closed");
    }

    const room = await this.getRoomCode();
    await this.state.storage.deleteAll();
    if (room) {
      await releaseRoom(this.env, room);
    }
  }

  private async handleEvent(ws: WebSocket, event: WSEvent) {
    const room = await this.getRoomCode(event.room);

    if (event.action !== "pong" && event.action !== "buzz") {
      await this.touch();
    }

    switch (event.action) {
      case "host_room":
        await this.hostRoom(ws, room);
        break;
      case "join_room":
        await this.joinRoom(ws, room, event.name || "Pilot");
        break;
      case "get_back_in":
        await this.getBackIn(ws, event);
        break;
      case "game_window":
      case "registerspectator":
        await this.registerDisplay(ws, event);
        break;
      case "change_lang":
        this.broadcast({ action: "change_lang", data: event.data || "en", games: ["games/en/themed/gundam.json"] });
        break;
      case "load_game":
        await this.requireHost(event);
        await this.loadGame();
        break;
      case "data":
        await this.updateGame(event.data);
        break;
      case "registerbuzz":
        await this.registerBuzzer(ws, event);
        break;
      case "buzz":
        await this.buzz(ws, event);
        break;
      case "clearbuzzers":
        await this.requireHost(event);
        await this.clearBuzzers();
        break;
      case "end_game":
        await this.requireHost(event);
        await this.endGame(event);
        break;
      case "register_buzzer_screen":
        await this.requireHost(event);
        await this.registerBuzzerScreen(ws);
        break;
      case "buzzer_screen_buzz":
        await this.requireHost(event);
        await this.buzzerScreenBuzz(event);
        break;
      case "quit":
        await this.quit(ws, event);
        break;
      case "logo_upload":
      case "title_music_upload":
      case "del_logo_upload":
      case "del_title_music_upload":
        this.send(ws, {
          action: "error",
          code: "errors.forbidden",
          message: "Custom assets are disabled for this version.",
        });
        break;
      case "pong":
        await this.pong(event);
        break;
      default:
        this.broadcast(event);
    }
  }

  private async hostRoom(ws: WebSocket, room: string) {
    const existing = await this.state.storage.get<Game>("game");
    const hostPassword = existing ? await this.state.storage.get<string>("hostPassword") : randomHostPassword();
    const game = existing ?? createGame(room);
    const hostId = existing?.host.id || randomId();
    game.host.id = hostId;
    game.registeredPlayers[hostId] = { name: "Host", team: null };
    await this.state.storage.put("game", game);
    await this.state.storage.put("hostPassword", hostPassword);
    ws.serializeAttachment({ room, id: hostId, role: "host" } satisfies ClientAttachment);
    this.send(ws, { action: "host_room", room, game, id: hostId, hostPassword });
  }

  private async joinRoom(ws: WebSocket, room: string, name: string) {
    const game = await this.getGame();
    const id = randomId();
    game.registeredPlayers[id] = { name, team: null };
    await this.saveGame(game);
    ws.serializeAttachment({ room, id, role: "player" } satisfies ClientAttachment);
    this.send(ws, { action: "join_room", room, game, id });
    this.broadcastData(game);
  }

  private async getBackIn(ws: WebSocket, event: WSEvent) {
    const sessionParts = event.session?.split(":") ?? [];
    const [room, id, hostPassword] = sessionParts;
    const game = await this.getGame();
    if (!room || !id || room !== game.room) {
      this.send(ws, { action: "error", code: "errors.room_not_found" });
      return;
    }

    const isHost = id === game.host.id;
    if (!isHost && !game.registeredPlayers[id]) {
      this.send(ws, { action: "error", code: "errors.player_not_found" });
      return;
    }

    ws.serializeAttachment({ room, id, role: isHost ? "host" : "player" } satisfies ClientAttachment);
    this.send(ws, {
      action: "get_back_in",
      room,
      game,
      id,
      player: isHost ? {} : game.registeredPlayers[id],
      host: isHost,
      hostPassword: isHost ? hostPassword : "",
    });
  }

  private async registerDisplay(ws: WebSocket, event: WSEvent) {
    const sessionParts = event.session?.split(":") ?? [];
    const [room] = sessionParts;
    const game = await this.getGame();
    ws.serializeAttachment({ room: room || game.room, role: "display" } satisfies ClientAttachment);
    this.send(ws, { action: "data", data: game });
  }

  private async loadGame() {
    const game = await this.getGame();
    game.rounds = clone(GUNDAM_GAME.rounds).map((round) => ({
      ...round,
      answers: round.answers.map((answer) => ({ ...answer, trig: false })),
    }));
    game.final_round = clone(GUNDAM_GAME.final_round);
    game.final_round_2 = clone(GUNDAM_GAME.final_round);
    game.final_round_timers = [...GUNDAM_GAME.final_round_timers];
    game.point_tracker = game.rounds.map(() => 0);
    game.is_sudden_death = false;
    game.winner_team = null;
    game.game_over = false;
    await this.saveGame(game);
    this.broadcastData(game);
  }

  private async updateGame(data: Game) {
    const previous = await this.getGame();
    const game = { ...previous, ...data, room: previous.room, host: previous.host };
    if (previous.round !== game.round || previous.title !== game.title) {
      game.buzzed = [];
      game.round_start_time = now();
      this.broadcast({ action: "clearbuzzers" });
    }
    await this.saveGame(game);
    this.broadcastData(game);
  }

  private async registerBuzzer(ws: WebSocket, event: WSEvent) {
    const game = await this.getGame();
    if (!event.id || !game.registeredPlayers[event.id]) {
      this.send(ws, { action: "error", code: "errors.player_not_found" });
      return;
    }
    game.registeredPlayers[event.id].team = event.team ?? null;
    game.registeredPlayers[event.id].start = new Date().toISOString();
    ws.serializeAttachment({ room: game.room, id: event.id, role: "player" } satisfies ClientAttachment);
    await this.saveGame(game);
    this.send(ws, { action: "ping", id: event.id });
    this.send(ws, { action: "registered", id: event.id });
    this.broadcastData(game);
  }

  private async buzz(ws: WebSocket, event: WSEvent) {
    const game = await this.getGame();
    if (!event.id || !game.registeredPlayers[event.id]) {
      this.send(ws, { action: "error", code: "errors.player_not_found" });
      return;
    }
    const player = game.registeredPlayers[event.id];
    const latency = player.latency ?? 0;
    game.buzzed = game.buzzed.filter((buzzed) => buzzed.id !== event.id);
    game.buzzed.push({ id: event.id, time: now() - latency });
    game.buzzed.sort((a, b) => a.time - b.time);
    await this.saveGame(game);
    this.send(ws, { action: "buzzed" });
    this.broadcastData(game);
  }

  private async clearBuzzers() {
    const game = await this.getGame();
    game.buzzed = [];
    await this.saveGame(game);
    this.broadcastData(game);
    this.broadcast({ action: "clearbuzzers" });
  }

  private async registerBuzzerScreen(ws: WebSocket) {
    const game = await this.getGame();
    ws.serializeAttachment({ room: game.room, role: "buzzer-screen" } satisfies ClientAttachment);
    this.send(ws, { action: "register_buzzer_screen" });
    this.send(ws, { action: "data", data: game });
  }

  private async endGame(event: WSEvent) {
    const game = await this.getGame();
    if (typeof event.data?.winner_team === "number") {
      game.winner_team = event.data.winner_team;
    }
    game.game_over = true;
    await this.saveGame(game);
    this.broadcastData(game);
    await this.scheduleClose();
  }

  private async buzzerScreenBuzz(event: WSEvent) {
    const game = await this.getGame();
    if (event.team == null) {
      return;
    }
    const alreadyBuzzed = game.buzzed.some((buzzed) => buzzed.team === event.team);
    if (!alreadyBuzzed) {
      game.buzzed.push({ team: event.team, time: now() });
      game.buzzed.sort((a, b) => a.time - b.time);
      await this.saveGame(game);
    }
    this.broadcast({ action: "buzzed" });
    this.broadcastData(game);
  }

  private async quit(ws: WebSocket, event: WSEvent) {
    const game = await this.getGame();
    if (event.host) {
      this.broadcast({ action: "quit" });
      this.broadcast({ action: "error", code: "errors.host_quit" });
      await this.scheduleClose();
      return;
    }

    if (event.id) {
      delete game.registeredPlayers[event.id];
      game.buzzed = game.buzzed.filter((buzzed) => buzzed.id !== event.id);
      await this.saveGame(game);
      this.send(ws, { action: "quit" });
      ws.close(1000, "Player quit");
      this.broadcastData(game);
    }
  }

  private async pong(event: WSEvent) {
    if (!event.id) {
      return;
    }
    const game = await this.getGame();
    const player = game.registeredPlayers[event.id];
    if (!player?.start) {
      return;
    }
    const latency = Math.max(0, now() - new Date(player.start).getTime());
    player.latencies = [...(player.latencies ?? []), latency].slice(-5);
    player.latency = Math.round(player.latencies.reduce((sum, value) => sum + value, 0) / player.latencies.length);
    await this.saveGame(game);
  }

  private async requireHost(event: WSEvent) {
    const hostPassword = await this.state.storage.get<string>("hostPassword");
    if (!hostPassword || event.hostPassword !== hostPassword) {
      throw new Error("Unauthorized host action");
    }
  }

  private async getGame() {
    const game = await this.state.storage.get<Game>("game");
    if (!game) {
      throw new Error("Room not found");
    }
    return game;
  }

  private async saveGame(game: Game) {
    game.tick = now();
    await this.state.storage.put("game", game);
  }

  private async touch() {
    const game = await this.state.storage.get<Game>("game");
    if (game) {
      game.tick = now();
      await this.state.storage.put("game", game);
    }
  }

  private async getRoomCode(fallback?: string) {
    return fallback || (await this.state.storage.get<string>("room")) || "";
  }

  private broadcastData(game: Game) {
    this.broadcast({ action: "data", data: game });
  }

  private broadcast(data: unknown) {
    const payload = JSON.stringify(data);
    for (const socket of this.state.getWebSockets()) {
      socket.send(payload);
    }
  }

  private send(ws: WebSocket, data: unknown) {
    ws.send(JSON.stringify(data));
  }

  private async scheduleCloseIfEmpty(closedSocket: WebSocket) {
    const connectedSockets = this.state.getWebSockets().filter((socket) => socket !== closedSocket);
    if (connectedSockets.length === 0) {
      await this.scheduleClose();
    }
  }

  private async scheduleClose() {
    const closeAt = now() + ROOM_GRACE_MS;
    await this.state.storage.put("closeAt", closeAt);
    await this.state.storage.setAlarm(closeAt);
    const room = await this.getRoomCode();
    if (room) {
      const id = this.env.ROOM_DIRECTORY.idFromName("global");
      await this.env.ROOM_DIRECTORY.get(id).fetch(`https://directory/expire/${room}`, { method: "POST" });
    }
  }
}
