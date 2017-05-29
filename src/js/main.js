let player = new WMPlayer({
	containerSelector: '.wm',
	songList: [[
		{
			name: '新建歌单',
			singer: 'hia',
			img: 'static/img/cover.png'
		},
		{
			name: '江湖',
			singer: '许嵩',
			img: 'static/img/cover.png',
			url: '',
			lrc: '',
			ajax: false
		}
	]],
	basicIsFirst: true,
	listFormat: '',
	bindEventOnListRootElement: false
});

