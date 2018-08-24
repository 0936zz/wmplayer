import WMPlayer from './wmplayer';

let player: WMPlayer = new WMPlayer({
	songList: [
		[
			{
				common: true,
				name: 'ACG精选',
				cover: '/image/cover.jpg'
			},
			{
				name: ''
			}
		]
	],
});
console.log(player);

