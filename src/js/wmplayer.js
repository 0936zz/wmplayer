class WMPlayer {
	/**
	 * @callback bindEvent
	 * @this WMPlayer
	 * @return {Boolean} 返回false取消播放
	 */
	/**
	 * 构造函数
	 * @param {Object}  config
	 * @param {String}  config.containerSelector WMPlayer的容器选择器，可设置多个
	 * @param {Object[]} config.songList        歌曲播放列表
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
		let classArray = ['play-btn', 'next', 'prev', 'mute'];
		this.dom = {
			container: $(this.config.containerSelector),
		};
		for (let i = 0; i < classArray.length; i++) {
			let domName = classArray[i].replace(/-(\w)/g, function ($0, $1) {
				return $1.toUpperCase();
			});
			this.dom[domName] = this.dom.container.find(`[data-wm-${classArray[i]}]`);
		}
		this.audio = $('<audio></audio>');
		this.data = {};
		this.regex = {
			lrc: new RegExp('\\[(\\d{2})(&#58;|:)(\\d{2})(&#46;|\\.)(\\d{2})\\]([^\\[]+)', 'g'),
			tpl: new RegExp('\\$\\{(\\w+)}\\$', 'g')
		};
		this.callbacks = {};
		this._formatList();
		this._bindEvents();
		callback && callback();
		if (this.config.autoPlay) {
			this.play();
		}
	}

	/**
	 * 初始化时给DOM绑定事件
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
	 * 获取列表公用数据，并向列表中添加歌曲
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
			this.addSong(list[i], i);
		}
	}

	/**
	 * 播放前更新歌曲信息
	 * @private
	 * @todo 修改dom
	 */
	_setInfo (list, song) {
		let songInfo = this.getInfo(list, song);
		// 设置当前播放歌曲
		this.audio.attr('src', songInfo.src);
		this._data({
			'currentList': list,
			'currentSong': song
		});
		// 输出歌名和歌手
		this.dom.name.html(songInfo.name);
		this.dom.singer.html(songInfo.singer);
		// 更换封面
		this.dom.cover.attr('src', songInfo.img);
		// 更换歌词
		this._setLrc(songInfo.lrc, songInfo.ajax);
		// 进度条归零
		this.dom.progress.width(0);
		// 列表添加样式
		if (list === this.getDisplayList()) {
			this._setCurrent(song);
		}
	}

	/**
	 * 获取/设置数据
	 * @private
	 */
	_data (key, value) {
		if (typeof value === 'undefined' && typeof key === 'object') {
			$.each(key, (key, value) => {
				this._data(key, value);
			});
		} else if (typeof value === 'undefined') {
			return this.data[key];
		} else {
			this.data[key] = value;
		}
	}

	/**
	 * 解析lrc歌词
	 * @param lrc
	 * @return {object}
	 * @todo 添加offset解析
	 * @private
	 */
	_parseLrc (lrc) {
		let reg = this.regex.lrc;
		let obj = {};
		// 匹配歌词
		let result = null;
		/*eslint no-cond-assign: off*/
		while (result = reg.exec(lrc)) {
			let time = Math.round((parseInt(result[1]) * 60 + parseInt(result[3]) + parseInt(result[5]) / 100) * 1000);
			obj[time] = $.trim(result[6]) || '&nbsp;';
		}
		return obj;
	}

	/**
	 * 触发事件
	 * @param name 事件名
	 * @private
	 */
	_trigger (name) {
		return this.callbacks[name] && this.callbacks[name].apply(this);
	}

	/**
	 * 播放
	 * @param {number} [list] 列表序号
	 * @param {number} [song] 歌曲序号
	 * @see 注：此函数有三种传参形式<br>
	 * 1. 不传任何参数：代表播放已暂停的歌曲，如果正在播放就什么也不做<br>
	 * 2. 只传一个参数：代表播放当前列表的第list首歌<br>
	 * 3. 两个参数都传：代表播放第list个列表的第song首歌
	 */
	play (list, song) {
		if (list === undefined && song === undefined) {
			let flag = this._trigger('beforePlay');
			if (!flag) {
				return false;
			} else {
				this.audio.get(0).play();
				// TODO 修改class
				this.dom.play.addClass('wm-play');
			}
		} else if (list !== undefined && song === undefined) {
			song = list;
			list = this.getCurrentList();
			this.play(list, song);
		} else {
			let num = this.getSongNum(list);
			if (song >= num) {
				song = num - 1;
			} else if (song < 0) {
				song = 0;
			}
			this._setInfo(list, song);
			this.play();
		}
	}

	/**
	 * 暂停播放
	 */
	pause () {
		this.audio.get(0).pause();
	}

	/**
	 * 切换播放状态
	 */
	togglePlay () {
		let playing = this.isPlaying();
		if (playing) {
			this.pause();
		} else {
			this.play();
		}
	}

	/**
	 * 获取是否正在播放
	 * @return {boolean}
	 */
	isPlaying () {
		return !this.audio.prop('paused');
	}

	/**
	 * 切换当前显示的列表
	 * @param list
	 */
	changeList (list) {
		// 设置列表活动类
		this.dom.listTitle.find('.wm-list-title-current').removeClass('wm-list-title-current');
		this.dom.listTitle.find('.wm-list-title-' + list).addClass('wm-list-title-current');
		// 切换audio标签的显示列表
		this._data('displayList', list);
		// 清除播放列表
		this.dom.list.html('');
		// 获取列表模板
		let format = this.config.listFormat;
		// 匹配正则
		for (let i = 0; i < this.list[list].length; i++) {
			let content = format;
			content.replace(/\$\{(\w+)}\$/g, function () {
				console.log(arguments);
			});
			// 输出列表
			this.dom.list.append(content);
		}
		// 为列表当前播放歌曲添加样式
		if (list === this.getCurrentList()) {
			this._setCurrent(this.getCurrentSong());
		}
	}

	/**
	 * 向列表中添加歌曲
	 * @param {object|Array} data           歌曲数据，格式同配置中的songList，数组会自动遍历
	 * @param {number} [list=当前播放列表]    添加到列表的序号
	 * @param {number} [index]              添加到的索引，默认为最后一个
	 */
	addSong (data, list = this.getCurrentList(), index = this.list[list].length) {
		if (data instanceof Array) {
			for (let i = 0; i < data.length; i++) {
				this.addSong(data[i], list, index + i);
			}
		} else {
			let lrc = data.lrc;
			if (!data.ajax) {
				data.lrc = this._parseLrc(lrc);
			}
			let tempData = {
				singer: this.list[list].singer,
				name: this.config.defaultText,
				img: this.list[list].img,
				ajax: false,
			};
			let song = $.extend({}, tempData, data);
			this.list[list].splice(index, 0, song);
			if (list === this.getCurrentList()) {
				// 调用changeList方法可以刷新列表中显示的歌曲
				this.changeList(list);
			}
		}
	}

	/**
	 * 获取指定的歌曲信息
	 * @param {number} [list=当前播放列表]  列表序号
	 * @param {number} [song=当前播放歌曲]  歌曲序号
	 * @returns {object}
	 */
	getInfo (list = this.getCurrentList(), song = this.getCurrentSong()) {
		return this.list[list][song];
	}

	/**
	 * 获取当前正在播放的列表
	 * @param {boolean} [info=false]    true返回完整列表，false返回序号
	 * @return {number}
	 */
	getCurrentList (info = false) {
		let list = this._data('currentSong');
		return info ? this.list[list] : list;
	}

	/**
	 * 获取当前播放歌曲的信息
	 * @param {boolean} [info=false]    true返回完整信息，false返回序号
	 * @returns {object|int}
	 */

	getCurrentSong (info = false) {
		if (info) {
			return this.getInfo();
		} else {
			return parseInt(this._data('currentSong'));
		}
	}


	/**
	 * 获取当前显示的列表
	 * @param {boolean} [info=false]    true返回完整列表，false返回序号
	 * @return {number|Object}
	 */
	getDisplayList (info = false) {
		if (info) {
			return this.getList(this.getDisplayList());
		} else {
			return parseInt(this._data('displayList'));
		}
	}

	/**
	 * 返回指定列表序号的信息
	 * @param {number} [list=当前播放列表]    列表序号
	 * @returns {{name: string, num: number, songs: Array}}
	 */
	getList (list = this.getCurrentList()) {
		let listArr = this.list[list];
		return {
			name: listArr.name,
			num: listArr.length,
			songs: listArr
		};
	}

	/**

	 * 绑定事件
	 * @param {string} name 事件名
	 * @param {Function} cb 回调
	 * @returns {WMPlayer}
	 */
	on (name, cb) {
		this.callbacks[name] = cb;
		return this;
	}

}

