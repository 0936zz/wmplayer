class WMPlayer {
	/**
	 * @callback bindEvent
	 * @param {WMPlayer} player
	 * @return {Boolean} 返回false取消播放
	 */
	/**
	 * 构造函数
	 * @param {Object}  config
	 * @param {String}  config.containerSelector WMPlayer的容器，可设置多个
	 * @param {Array[]} config.songList         歌曲播放列表
	 * @param {String}  config.listTpl          列表输出模板，可插入模板变量
	 * @param {String}  [config.defaultImg]     封面图片加载失败时显示的图片
	 * @param {String}  [config.defaultText]    模板中未定义时的默认文字
	 * @param {Boolean} [config.autoPlay=true]
	 * @param {bindEvent} [callback]
	 */
	constructor (config, callback) {
		let defaultConfig = {
			autoPlay: false,
			basicIsFirst: false,
			defaultText: ''
		};
		this.config = $.extend({}, config, defaultConfig);
		// TODO 将class获取元素黄换为data属性获取
		let classArray = ['play-btn', 'next', 'prev', 'mute'];
		this.dom = {
			container: $(this.config.containerSelector),
		};
		for (let i = 0; i < classArray.length; i++) {
			let domName = classArray[i].replace(/-(\w)/g, function ($0, $1) {
				return $1.toUpperCase();
			});
			this.dom[domName] = this.dom.container.find('[data-wm-' + classArray[i] + ']');
		}
		this.audio = $('<audio></audio>');
		this.data = {};
		this._formatList();
		this._bindEvents();

		callback && callback(this);
		if (this.config.autoPlay) {
			this.play();
		}
	}

	/**
	 * @private
	 */
	_bindEvents () {
		this.dom.playBtn.on('click', () => {
			this.togglePlay();
		});

		this.audio.on('play pause', () => {

		});

	}

	/**
	 *
	 * @private
	 */
	_formatList () {
		let list = this.config.songList;
		this.list = [];
		let basicIsFirst = this.config.basicIsFirst;

		function getBasic (list) {
			for (let j = 0; j < list.length; j++) {
				if (list[j].basic) {
					return j;
				}
			}
			return 0;
		}

		for (let i = 0; i < list.length; i++) {
			this.list[i] = [];
			let basicIndex = basicIsFirst ? 0 : getBasic(list[i]);
			this.list[i].name = list[i][basicIndex].name || this.config.defaultText;
			this.list[i].singer = list[i][basicIndex].singer || this.config.defaultText;
			this.list[i].image = list[i][basicIndex].img || this.config.defaultImg;
			list[i].splice(basicIndex, 1);
			for (let j = 0; j < list[i].length; j++) {
				this.addSong(list[i][j], i);
			}
		}
	}

	/**
	 * @private
	 */
	_setInfo (list, song) {

	}

	/**
	 * @private
	 */
	_data (key, value) {
		if (typeof value === 'undefined') {
			return this.data[key];
		}
		this.data[key] = value;
	}

	_parseLrc (lrc) {

	}

	play () {

	}

	pause () {

	}

	togglePlay () {
		let playing = this.isPlaying();
		if (playing) {
			this.pause();
		} else {
			this.play();
		}
	}

	isPlaying () {
		return this.audio.prop('playing');
	}

	changeList (list) {

	}

	addSong (data, list = this.getCurrentList(), index = this.list[list].length) {
		if (data instanceof Array) {
			for (let i = 0; i < data.length; i++) {
				this.addSong(data[i], list, index + i);
			}
		} else {
			let lrc = data.lrc;
			if (!data.ajax) {
				lrc = this._parseLrc(lrc);
			}
			let tempData = {
				singer: this.list[list].singer,
				name: this.config.defaultText,
				img: this.list[list].img,
				ajax: false
			};
			let song = $.extend({},tempData,data);
			this.list[list].splice(index, 0, song);
			console.log(this.list);
			if (list === this.getCurrentList()) {
				// 调用changeList方法可以刷新列表中显示的歌曲
				this.changeList(list);
			}
		}
	}

	/**
	 * 获取当前正在播放的列表
	 * @param {boolean} [info=false] true返回完整列表，false返回序号
	 * @return {number}
	 */
	getCurrentList (info = false) {
		let list = this._data('currentSong');
		return info ? this.list[list] : list;
	}
}

