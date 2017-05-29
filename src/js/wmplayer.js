class WMPlayer {
	/**
	 * @callback bindEvent
	 * @param {WMPlayer} player
	 * @return {Boolean} 返回false取消播放
	 */
	/**
	 *
	 * @param {Object}  config
	 * @param {String}  config.containerSelector WMPlayer的容器，可设置多个
	 * @param {Array[]} config.songList         歌曲播放列表
	 * @param {String}  config.listTpl          列表输出模板，可插入模板变量
	 * @param {String}  [config.defaultImg]
	 * @param {Boolean} [config.autoPlay=true]
	 * @param {bindEvent} [callback]
	 */
	constructor (config, callback) {
		let defaultConfig = {
			autoPlay: false
		};
		this.config = $.extend({}, config, defaultConfig);
		this.list = this._formatList(this.config.songList);
		let classArray = ['play', 'next', 'prev', 'volume', 'listCurrent', 'listTitle'];
		this.dom = {
			container: $(this.config.containerSelector),
		};
		for (let i = 0; i < classArray.length; i++) {
			let className = classArray[i].replace(/([A-Z])/g, '-$1').toLowerCase();
			this.dom[classArray[i]] = this.dom.container.find('.wm-' + className);
		}
		this.audio = $('<audio></audio>');
		this.data = $('<div></div>');
		this._bindEvents();

		if (this.config.autoPlay) {
			this.play();
		}
	}

	/**
	 * @private
	 */
	_bindEvents () {
		this.dom.play.on('click', function () {
			this.togglePlay();
		});
	}

	_formatList (list) {
		
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
			return this.data.data(key);
		}
		this.data.data(key, value);
	}

	togglePlay () {
		let playing = this.isPlaying();
	}

	isPlaying () {
		return this.audio.prop('playing');
	}
}

