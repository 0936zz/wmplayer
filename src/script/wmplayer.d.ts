declare module 'WMPlayer' {
	export = WMPlayer;
}

/**
 * @typedef {any} any
 */
declare class WMPlayer {
	private audio: HTMLAudioElement;
	private store: Map<string, any>;
	private dom: Map<string, HTMLElement>;
	private events: Map<string, Function>;
	private config: any;
	private list: WMPlayerSongListItem[][];

	/**
	 * initialize wmplayer instance
	 * @param {WMPlayerConstructorConfig} config
	 */
	constructor (config: WMPlayerConstructorConfig);

	/**
	 * start playing
	 */
	start (): void;

	/**
	 * play song which belongs to current playing list and whose index is `songIndex`(basic object should not be in range)
	 * @param {number} songIndex
	 */
	play (songIndex: number): void;

	/**
	 * play song which belongs to `listIndex` list and whose index is `songIndex`(basic object should not be in range)
	 * @param {number} listIndex
	 * @param {number} songIndex
	 */
	play (listIndex: number, songIndex: number): void;

	addSong (): void;

	/**
	 * bind event
	 * @param {string} eventName event name
	 * @param {Function} handler event handler
	 */
	on (eventName: string, handler: Function): WMPlayer;

	/**
	 * emit event
	 * @param {string} eventName
	 * @param {Array<any>} args
	 */
	private emit (eventName: string, args: Array<any>): void;

	/**
	 * get data
	 * @param {string} key
	 * @returns {any}
	 */
	private data (key: string): any;

	/**
	 * set data
	 * @param {string} key
	 * @param {any} value
	 */
	private data (key: string, value: any): void;

	/**
	 * format song list
	 */
	private formatList (): void;

	/**
	 * initialize instance
	 */
	private initialize (): void;
}

interface WMPlayerConstructorConfig {
	songList: WMPlayerSongListItem[][]
}

interface WMPlayerSongListItem {
	// (to mark is this a common object)
	common?: boolean,
	// song name (list name for common object)
	name?: string,
	// singer (if the song does'nt have this field but common object has, it will use the value in common object)
	singer?: string,
	// song cover (if the song does'nt hve this field but common object has, it will use the value in common object)
	cover?: string,
	// song url
	src?: string,
	// lyric in lrc format
	lrc?: string,
	// if you want to get lyric from a ajax request, please set it to true and put request url in `lrc` field
	ajax?: boolean
}
