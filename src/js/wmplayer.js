class WMPlayer {
	/**
	 * 初始化结束后触发，用于绑定事件或处理函数
	 * @callback afterInit
	 * @this WMPlayer
	 * @return {Boolean} 返回false取消自动播放
	 */
	/**
	 * 每首歌播放前触发
	 * @callback beforePlay
	 * @this WMPlayer
	 * @return {Boolean} 返回false取消播放
	 */
	/**
	 * 苹果及安卓Chrome由于权限问题无法正常自动播放时会触发此事件
	 * @callback onAutoPlayError
	 * @param {Error} error 错误信息
	 */
	/**
	 * 每次更换列表前触发
	 * @callback beforeChangeList
	 * @param {String}  list    切换的目标列表
	 * @param {String}  oldList 现在显示的列表
	 */

	/**
	 * 进度条处理函数（包括缓冲条和进度条）
	 * @callback progressHandle
	 * @this WMPlayer
	 * @param {jQuery} progress 进度条元素
	 * @param {number} percent  进度百分比
	 * @param {String} type     buffer代表缓冲 play代表播放
	 */


	/**
	 * 构造函数
	 * @constructor
	 * @param {Object}  config
	 * @param {String}  config.containerSelector WMPlayer的容器选择器，可设置多个
	 * @param {Array}   config.songList         歌曲播放列表
	 * @param {String}  config.listTpl          列表输出模板，可插入模板变量
	 * @param {String}  [config.defaultImg]     封面图片加载失败时显示的图片
	 * @param {String}  [config.defaultText]    模板中未定义时的默认文字
	 * @param {String}  [config.currentListClass]   当前播放列表的class
	 * @param {String}  [config.currentSongClass]   当前播放歌曲的class，将会添加到具有data-wm-current-song-class属性的元素上
	 * @param {String}  [config.currentLrcClass]    当前播放歌词的class
	 * @param {String}  [config.progressCSSPrototype] 修改进度条的CSS属性，只支持width或height，当绑定{@link progressHandle}后此配置不再起作用
	 * @param {Boolean} [config.autoPlay=true]  是否自动播放
	 * @param {afterInit} [callback]    程序初始化结束后用于绑定事件和处理函数的回调
	 */
	constructor (config, callback) {
		// 默认配置
		let defaultConfig = {
			autoPlay: false,
			basicIsFirst: false,
			defaultText: '-',
			playList: 0,
			playSong: 0,
			tplLeftDelimiter: '${',
			tplRightDelimiter: '}$',
			progressCSSPrototype: 'width'
		};

		/**
		 * 格式化模板定界符
		 * @param str
		 * @return {string}
		 * @private
		 */
		function formatDelimiter (str) {
			// 将( ) [ ] { } ^ $ 加上转义符
			let reg = new RegExp('(\\{|\\}|\\[|\\]|\\(|\\)|\\^|\\$)', 'g');
			return str.replace(reg, (value) => {
				return '\\' + value;
			});
		}

		// 合并配置项
		this.config = $.extend({}, defaultConfig, config);
		// 需要获取的dom数组，play-btn会获取data-wm-play-btn
		let attrArray = ['play-btn', 'next', 'prev', 'mute', 'name', 'singer', 'cover', 'progress', 'list', 'list-title', 'lrc', 'progress', 'progress-played'];
		this.dom = {
			container: $(this.config.containerSelector),
		};
		for (let i = 0; i < attrArray.length; i++) {
			// 横杆转驼峰
			let domName = attrArray[i].replace(/-(\w)/g, ($0, $1) => {
				return $1.toUpperCase();
			});
			// 获取dom
			this.dom[domName] = this.dom.container.find(`[data-wm-${attrArray[i]}]`);
		}
		// 初始化audio标签
		this.audio = $('<audio></audio>');
		// 初始化数据存储对象
		this.data = {};
		// 匹配歌词和模板的正则表达式
		this.regex = {
			lrc: new RegExp('\\[(\\d{2})(&#58;|:)(\\d{2})(&#46;|\\.)(\\d{2})\\]([^\\[]+)', 'g'),
			tpl: new RegExp(formatDelimiter(this.config.tplLeftDelimiter) + '(\\w+)' + formatDelimiter(this.config.tplRightDelimiter), 'g')
		};
		// 回调函数和处理函数对象
		this.callbacks = {};
		this.handles = {};
		// 格式化列表
		this._formatList();
		// 输出列表名称
		this._setList();
		// 绑定事件
		this._bindEvents();
		// 输出当前播放列表的歌曲
		this.changeList(this.config.playList);
		// 显示歌曲信息
		this._setInfo(this.config.playList, this.config.playSong);
		// 绑定事件的回调
		if (callback && callback.call(this) === false) this.config.autoPlay = false;
		// 自动播放
		if (this.config.autoPlay) {
			this.play();
		}
	}

	/**
	 * 初始化时给DOM绑定事件
	 * @private
	 */
	_bindEvents () {
		// 播放暂停按钮
		this.dom.playBtn.on('click', () => {
			this.togglePlay();
		});
		// 播放暂停、时间更新
		this.audio.on('play pause', () => {
			// 播放或暂停时修改播放按钮的状态
			let funName = this.isPlaying() ? 'addClass' : 'removeClass';
			this.dom.playBtn[funName]('wm-playing');
		}).on('timeupdate', () => {
			// 更新进度条
			this._updateProgress();
			this.updateLrc();
			this._trigger('timeUpdate');
		});
		// 下一首
		this.dom.next.on('click', () => {
			this.next();
		});
		// 上一首
		this.dom.prev.on('click', () => {
			this.prev();
		});
		// 封面加载错误
		this.dom.cover.on('error', () => {
			let img = this.dom.cover.attr('src');
			let defaultImg = this.config.defaultImg;
			// 防止默认图片出错
			if (img !== defaultImg) {
				this.dom.cover.attr('src', defaultImg);
			} else {
				// TODO 默认图片加载出错callback
			}

		});
		// 切换列表
		this.dom.listTitle.on('click', 'li', (event) => {
			let e = $(event.target);
			let index = parseInt(e.data('wm-list-title-index'));
			this._data('displayList', index);
			this.changeList(index);
		});
		// 切换歌曲
		this.dom.list.on('click', '[data-wm-list-play-btn]', (event) => {
			let e = event.target;
			// 可能会有一个页面有多个列表存在，故使用查找父元素的方法寻找列表
			let list = $(e).parents('[data-wm-list]');
			let btnList = list.find('[data-wm-list-play-btn]');
			// 由于jQuery对象是个伪数组，没有indexOf方法，因此只能遍历（划掉）
			// $.fn.toArray可以把jQuery对象转换为数组
			let index = btnList.toArray().indexOf(e);
			if (index !== -1) {
				this.play(this._data('displayList'), index);
			}
		});
		// 进度条
		this.dom.progress.on('click', (event) => {
			let x = event.offsetX;
			let width = this.dom.progress.width();
			this.setPercent(x / width * 100);
		});

	}

	/**
	 * 获取列表公用数据，并向列表中添加歌曲
	 * @private
	 */
	_formatList () {
		let list = this.config.songList;
		this.list = [];

		/**
		 * 寻找公用数据
		 * @param list
		 * @return {number}
		 */
		function getBasic (list) {
			for (let j = 0; j < list.length; j++) {
				if (list[j].basic) {
					return j;
				}
			}
			return 0;
		}

		for (let i = 0; i < list.length; i++) {
			// 添加列表公用数据
			this.list[i] = [];
			let basicIndex = getBasic(list[i]);
			this.list[i].name = list[i][basicIndex].name || this.config.defaultText;
			this.list[i].singer = list[i][basicIndex].singer || this.config.defaultText;
			this.list[i].img = list[i][basicIndex].img || this.config.defaultImg;
			list[i].splice(basicIndex, 1);
			// 添加歌曲
			this.addSong(list[i], i);
		}
	}

	/**
	 * 输出播放列表标题
	 * @private
	 */
	_setList () {
		let html = '';
		for (let i = 0; i < this.list.length; i++) {
			html += `<li data-wm-list-title-index="${i}">${this.list[i].name}<li>`;
		}
		this.dom.listTitle.html(html);
	}

	/**
	 * 播放前更新歌曲信息
	 * @param {number} list
	 * @param {number} song
	 * @private
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
		this.dom.name.html(songInfo.name).attr('title', songInfo.name);
		this.dom.singer.html(songInfo.singer).attr('title', songInfo.singer);
		// 更换封面
		this.dom.cover.attr('src', songInfo.img);
		// 更换歌词(包含ajax)
		this._setLrc(list, song);
		// 进度条归零
		this.dom.progressPlayed.width(0);
		// 歌词滚动归零
		this.dom.lrc.scrollTop(0);
		// 列表添加样式
		if (list === this.getDisplayList()) {
			this._setCurrent(song);
		}
	}

	/**
	 * 给当前播放的歌曲添加class
	 * @param index
	 * @private
	 */
	_setCurrent (index) {
		this.dom.list.find('.' + this.config.currentSongClass).removeClass(this.config.currentSongClass);
		this.dom.list.find('[data-wm-current-song-class]').eq(index).addClass(this.config.currentSongClass);
	}

	/**
	 * 更新进度条
	 * @private
	 */
	_updateProgress () {
		let percent = this.getPercent();
		if (this.handles.progress) {
			this.handles.progress.call(this, this.dom.progressPlayed, percent, 'play');
		} else {
			this.dom.progressPlayed.css(this.config.progressCSSPrototype, percent + '%');
		}
	}

	/**
	 * 设置歌词（包含ajax）
	 * @param {number} list
	 * @param {number} song
	 * @private
	 */
	_setLrc (list, song) {
		let info = this.getInfo(list, song);
		let ajax = info.ajax;
		let lrc = info.lrc;
		let outputLrc = (lrc) => {
			let html = '';
			let timeArr = [];
			$.each(lrc, (key, value) => {
				if (value instanceof Array) {
					for (let i = 0; i < value.length; i++) {
						html += `<li data-wm-lrc-${key}>${value[i]}</li>`;
					}
				} else {
					html += `<li data-wm-lrc-${key}>${value}</li>`;
				}
				timeArr.push(key);
			});
			this._data('timeArr', timeArr);
			this.dom.lrc.html(html);
			this.updateLrc();
		};
		if (ajax) {
			this.dom.lrc.html(`<li class="${this.config.currentLrcClass}">${WMPlayer.language.loadingLrc}</li>`);
			this.list[list][song].lrc = '';
			$.get(lrc).done((data) => {
				this.list[list][song].lrc = this._parseLrc(data);
				this.list[list][song].ajax = false;
				if (list === this.getCurrentList() && song === this.getCurrentSong()) {
					outputLrc(info.lrc);
				}
			}).fail(() => {
				this.dom.lrc.html(`<li class="${this.config.currentLrcClass}">${WMPlayer.language.loadLrcError}</li>`);
			});
		} else {
			outputLrc(lrc);
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
	 * @param {string} lrc
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
			let str = $.trim(result[6]) || '&nbsp;';
			obj[time] = obj[time] ? [obj[time], str] : str;
		}
		return obj;
	}

	/**
	 * 触发事件
	 * @param {String} name 事件名
	 * @param args
	 * @private
	 */
	_trigger (name, ...args) {
		return this.callbacks[name] && this.callbacks[name].apply(this, args);
	}

	/**
	 * 由程序调用时的下一首
	 * @private
	 */
	_autoNext () {
		let mode = this.getMode();
		let song = this.getCurrentSong();
		let num = this.getSongNum();
		switch (mode) {
			case 1:
				if (++song >= num) {
					song = 0;
				}
				break;
			case 2:
				break;
			case 3:
				// 随机
				break;
			case 0:
			default:
				break;
		}
		this.play(song);
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
		if (typeof list === 'undefined' && typeof song === 'undefined') {
			let flag = this._trigger('beforePlay');
			if (flag === false) {
				return false;
			} else {
				let playPromise = this.audio.get(0).play();
				if (typeof playPromise !== 'undefined') {
					playPromise.catch(error => {
						this._trigger('onAutoPlayError', error);
					});
				}
			}
		} else if (typeof list !== 'undefined' && typeof song === 'undefined') {
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
	 * 暂停
	 */
	pause () {
		this.audio.get(0).pause();
	}

	/**
	 * 切换静音
	 */
	mute () {
		this.audio.get(0).mute = !this.audio.get(0).mute;
	}

	/**
	 * 下一首（如果当前是最后一首就播放第一首）
	 */
	next () {
		let song = this.getCurrentSong();
		let num = this.getSongNum();
		if (++song >= num) {
			song = 0;
		}
		this.play(song);
	}

	/**
	 * 上一首（如果当前是第一首就播放最后一首）
	 */
	prev () {
		let song = this.getCurrentSong();
		let num = this.getSongNum();
		if (--song < 0) {
			song = num - 1;
		}
		this.play(song);
	}

	/**
	 * 设置播放模式
	 * @param {number} mode 0->顺序播放 1->列表循环 2->单曲循环 3->随机播放
	 */
	setMode (mode) {
		mode = Math.max(0, Math.min(3, mode));
		this._data('playMode', mode);
	}

	/**
	 * 获取播放模式
	 * @return {number}
	 */
	getMode () {
		return this._data('playMode');
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
		let oldList = this.getDisplayList();
		if (this._trigger('beforeChangeList', list, oldList) === false) return false;
		// 设置列表活动类
		this.dom.listTitle.find(`.${this.config.currentListClass}`).removeClass(this.config.currentListClass);
		this.dom.listTitle.find(`[data-wm-list-title-${list}]`).addClass(this.config.currentListClass);
		// 切换audio标签的显示列表
		this._data('displayList', list);
		// 清除播放列表
		this.dom.list.empty();
		// 获取列表模板
		let format = this.config.listFormat;
		// 匹配正则
		let content = '';
		for (let i = 0; i < this.list[list].length; i++) {
			content += format.replace(this.regex.tpl, (value, name) => {
				return this.list[list][i][name] || this.config.defaultText;
			});
		}
		// 输出列表
		this.dom.list.append(content);
		// // 为列表当前播放歌曲添加样式
		if (list === this.getCurrentList()) {
			this._setCurrent(this.getCurrentSong());
		}
		this._trigger('changeList', oldList, list);
	}

	/**
	 * 向列表中添加歌曲
	 * @param {object|Array} data           歌曲数据，格式同配置中的songList，数组会自动遍历
	 * @param {number} [list=当前播放列表]    添加到列表的序号
	 * @param {number} [index]              添加到的索引，默认为最后一个
	 */
	addSong (data, list = this.getCurrentList(), index = this.getSongNum(list)) {
		// 遍历数组数据
		if (data instanceof Array) {
			for (let i = 0; i < data.length; i++) {
				this.addSong(data[i], list, index + i);
			}
		} else {
			let lrc = data.lrc;
			// 判断歌词是否需要ajax获取，ajax获取歌词在_setLrc方法中
			if (!data.ajax) {
				data.lrc = this._parseLrc(lrc);
			}
			// 默认歌曲信息
			let tempData = {
				singer: this.list[list].singer,
				name: this.config.defaultText,
				img: this.list[list].img,
				ajax: false,
			};
			let song = $.extend({}, tempData, data);
			this.list[list].splice(index, 0, song);
			// 如果当前显示的列表是当前操作的列表，调用changeList方法可以刷新列表中显示的歌曲
			if (list === this.getCurrentList()) {
				this.changeList(list);
			}
		}
	}

	/**
	 * 获取当前播放时间（单位：秒）
	 * @return {number}
	 */
	getCurrentTime () {
		return Math.round(this.audio.prop('currentTime') * 1000);
	}

	/**
	 * 设置当前时间
	 * @param time
	 * @todo 添加缓存判断
	 */
	setCurrentTime (time) {
		this.audio.prop('currentTime', time / 1000);
	}

	/**
	 * 获取歌曲总长（单位：秒）
	 * @return {number}
	 */
	getDuration () {
		return Math.round(this.audio.prop('duration') * 1000);
	}

	/**
	 * 获取当前播放百分比（0-100）
	 * @return {number}
	 */
	getPercent () {
		return this.getCurrentTime() / this.getDuration() * 100;
	}

	/**
	 * 设置播放进度
	 * @param percent
	 */
	setPercent (percent) {
		let duration = this.getDuration();
		percent = percent / 100;
		let time = duration * percent;
		this.setCurrentTime(time);
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
		let list = this._data('currentList');
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
			return this._data('currentSong');
		}
	}

	/**
	 * 获取列表的歌曲数目
	 * @param {number} [list=当前播放列表]
	 * @return {number}
	 */
	getSongNum (list = this.getCurrentList()) {
		let info = this.getList(list);
		return info.length;
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
			return this._data('displayList');
		}
	}

	/**
	 * 返回指定列表序号的信息
	 * @param {number} [list=当前播放列表]    列表序号
	 * @returns {Array}
	 */
	getList (list = this.getCurrentList()) {
		return this.list[list];
	}

	/**
	 * 通过传入的时间返回指定时间的歌词
	 * @param {number} [time=当前时间]  不传代表当前时间，单位毫秒
	 * @param {boolean} [info=true]    true返回歌词字符串，false返回歌词开始时间（单位：毫秒）
	 */
	getLrc (time = this.getCurrentTime(), info = true) {
		let lrcList = this.getCurrentSong(true).lrc;
		// 降序排序时间数组
		let indexArray = Object.keys(lrcList).map(v => parseInt(v)).sort((a, b) => (b - a));
		// 寻找匹配时间
		let lrcIndex = indexArray.findIndex(index => {
			return time >= index;
		});
		return info ? this.getCurrentSong(true).lrc[indexArray[lrcIndex]] : indexArray[lrcIndex];
	}

	/**
	 * 更新歌词显示
	 */
	updateLrc () {
		let dataLrc = this._data('currentLrc');
		let currentLrc = this.getLrc(this.getCurrentTime(), false);
		if (typeof currentLrc === 'undefined') {
			// 如果歌词第一句前面有很多空白，这时从歌曲中间跳转到第一句前面时歌词不会变化，需手动处理
			this.dom.lrc.scrollTop(0);
		} else if (dataLrc !== currentLrc) {
			// 判断是否需要切换歌词
			// 设置当前歌词
			this._data('currentLrc', currentLrc);
			// 删除以前添加的class
			let currentClass = this.config.currentLrcClass;
			this.dom.lrc.find('.' + currentClass).removeClass(currentClass);
			this.dom.lrc.each(function (index, ele) {
				ele = $(ele);
				let lrc = ele.find(`[data-wm-lrc-${currentLrc}]`);
				// 添加class
				lrc.addClass(currentClass);
				// 计算滚动的高度
				let position = lrc.position();
				let positionTop = position ? position.top : 0;
				let top = ele.scrollTop();
				let lrcTop = parseInt(ele.data('wm-top') || 0);
				let time = parseInt(ele.data('wm-time') || 0);
				// 动画滚动
				ele.animate({
					scrollTop: top + positionTop - lrcTop
				}, time);
			});
		}
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

	/**
	 * 绑定处理函数
	 * @param name
	 * @param cb
	 * @returns {WMPlayer}
	 */
	handle (name, cb) {
		this.handles[name] = cb;
		return this;
	}
}
