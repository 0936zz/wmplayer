const WMPlayer = (function ($) {
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
		 * @param {String}  [config.currentListClass]   当前播放列表的class
		 * @param {String}  [config.currentSongClass]   当前播放歌曲的class
		 * @param {String}  [config.currentLrcClass]    当前播放歌词的class
		 * @param {Boolean} [config.autoPlay=true]
		 * @param {bindEvent} [callback]
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
				tplRightDelimiter: '}$'
			};
			// 合并配置项
			this.config = $.extend({}, defaultConfig, config);
			// 需要获取的dom数组，play-btn会获取data-wm-play-btn
			let attrArray = ['play-btn', 'next', 'prev', 'mute', 'name', 'singer', 'cover', 'progress', 'list', 'list-title'];
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
				tpl: new RegExp(this._formatDelimiter(this.config.tplLeftDelimiter) + '(\\w+)' + this._formatDelimiter(this.config.tplRightDelimiter), 'g')
			};
			// 回调函数对象
			this.callbacks = {};
			// 格式化列表
			this._formatList();
			// 输出列表名称
			this._outputList();
			// 绑定事件
			this._bindEvents();
			// 输出当前播放列表的歌曲
			this.changeList(this.config.playList);
			// 显示歌曲信息
			this._setInfo(this.config.playList, this.config.playSong);
			// 绑定事件的回调
			callback && callback();
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
			this.audio.on('play pause', () => {
				// 播放或暂停时修改播放按钮的状态
				let funName = this.isPlaying() ? 'addClass' : 'removeClass';
				this.dom.playBtn[funName]('wm-playing');
			}).on('timeupdate', () => {
				// var percent =

				this._trigger('timeUpdate');
			});
			// 下一首
			this.dom.next.on('click', () => {
				this.next();
			});
			// 封面加载错误
			this.dom.cover.on('error', () => {
				let img = this.dom.cover.attr('src');
				let defaultImg = this.config.defaultImg;
				// 放置默认图片出错
				if (img !== defaultImg) {
					this.dom.cover.attr('src', defaultImg);
				}
				// TODO canvas提示图片加载出错
			});
			// 切换列表
			this.dom.listTitle.on('click', 'li', (event) => {
				let e = $(event.target);
				let index = parseInt(e.data('wm-list-title-index'));
				this._data('displayList', index);
				this.changeList(index);
				// TODO 更换列表callback
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

		}

		/**
		 * 格式化模板定界符
		 * @param str
		 * @return {string}
		 * @private
		 */
		_formatDelimiter (str) {
			// 将( ) [ ] { } ^ $ 加上转义符
			let reg = new RegExp('(\\{|\\}|\\[|\\]|\\(|\\)|\\^|\\$)', 'g');
			return str.replace(reg, (value) => {
				return '\\' + value;
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
				let basicIndex = basicIsFirst ? 0 : getBasic(list[i]);
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
		_outputList () {
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
			this.dom.name.html(songInfo.name);
			this.dom.singer.html(songInfo.singer);
			// 更换封面
			this.dom.cover.attr('src', songInfo.img);
			// 更换歌词
			this._setLrc(list, song);
			// 进度条归零
			this.dom.progress.width(0);
			// 列表添加样式
			if (list === this.getDisplayList()) {
				// this._setCurrent(song);
			}
		}

		/**
		 * 给当前播放的歌曲添加class
		 * @param index
		 * @private
		 * @todo
		 */
		_setCurrent (index) {

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
			if (ajax) {
				this.dom.lrc.html(`<li class="${this.config.currentLrcClass}"></li>`);
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
				obj[time] = $.trim(result[6]) || '&nbsp;';
			}
			return obj;
		}

		/**
		 * 触发事件
		 * @param {String} name 事件名
		 * @param {Array}  args 参数
		 * @private
		 */
		_trigger (name, args) {
			return this.callbacks[name] && this.callbacks[name].apply(this, args);
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
					this.audio.get(0).play();
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
		 * 暂停播放
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
		 * @todo 未完成
		 */
		changeList (list) {
			this._trigger('changeList', [list]);
			// 设置列表活动类
			this.dom.listTitle.find(`.${this.config.currentListClass}`).removeClass(this.config.currentListClass);
			this.dom.listTitle.find(`[data-wm-list-title-${list}]`).addClass(this.config.currentListClass);
			// 切换audio标签的显示列表
			this._data('displayList', list);
			// 清除播放列表
			this.dom.list.empty();
			// // 获取列表模板
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
	return WMPlayer;
})(jQuery);