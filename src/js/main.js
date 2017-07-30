let player = new WMPlayer({
	containerSelector: '.wm,.wm-lrc',
	/*eslint no-undef: 0*/
	songList: wm_list,
	basicIsFirst: true,
	listFormat: '<li data-wm-current-song-class>' +
	'<img src="${img}$" alt="cover" class="wm-list-cover"> ' +
	'<p class="wm-list-song">${name}$</p> ' +
	'<p class="wm-list-singer">${singer}$</p> ' +
	'<button class="wm-list-play" data-wm-list-play-btn></button> ' +
	'</li>',
	currentListClass: 'wm-list-title-current',
	currentSongClass: 'wm-list-playing',
	currentLrcClass: '',
	tplLeftDelimiter: '${',
	tplRightDelimiter: '}$',
	progressCSSPrototype: 'width',
	autoPlay: true
}, function () {
	console.log(this);
	return false;
});


// 添加效果
$(function () {
	let wm = $('.wm');
	let listBtn = wm.find('.wm-list-toggle');
	let listBox = wm.find('.wm-list-box');
	let listToggle = wm.find('.wm-list-current');
	let playerToggle = wm.find('.wm-toggle');
	listBtn.on('click', () => {
		listBox.toggleClass('wm-list-hide');
	});
	listToggle.on('click', function () {
		player.dom.listTitle.fadeToggle(300);
	});
	playerToggle.on('click', function () {
		let time = 0;
		if (!listBox.hasClass('wm-list-hide')) {
			listBox.addClass('wm-list-hide');
			time = 300;
		}
		setTimeout(function () {
			wm.toggleClass('wm-hide');
		}, time);
	});
});
