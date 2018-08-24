///<reference path="wmplayer.d.ts"/>

export default class WMPlayer {
	private audio: HTMLAudioElement;
	private store: Map<string, any>;
	private dom: Map<string, HTMLElement>;
	private events: Map<string, Function>;
	private config: WMPlayerConstructorConfig;
	private list: WMPlayerSongListItem[][];

	public constructor (config: WMPlayerConstructorConfig) {
		this.config = config;
		this.initialize();
		this.formatList();
	}

	public addSong () {

	}

	public start () {
		this.audio.play().catch((err) => {
			this.emit('onPlayError', err);
		});
	}

	public play (list: number, song: number) {
	}


	public on (eventName: string, handler: Function): void {
		this.events.set(eventName, handler.bind(this));
	}


	protected emit (eventName: string, ...args: Array<any>): void {
		if (this.events.has(eventName)) {
			this.events.get(eventName)(args);
		}
	}

	protected data (key: string, value: any): any | void {
		if (typeof value === 'undefined') {
			return this.store.get(key);
		}
		this.store.set(key, value);
	}

	private formatList () {
		let list = this.config.songList;
		let formatted = [];

	}

	private initialize () {
		this.audio = document.createElement('audio');
		this.store = new Map();
		this.events = new Map();
		this.dom = new Map();
	}
}

