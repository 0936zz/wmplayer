const gulp = require('gulp');
const babel = require('gulp-babel');
const less = require('gulp-less');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const cleanCss = require('gulp-clean-css');
const autoPrefixer = require('gulp-autoprefixer');
const spritesmith = require('gulp.spritesmith');
const eslint = require('gulp-eslint');
const connect = require('gulp-connect');
const concat = require('gulp-concat');
const plumber = require('gulp-plumber');
const opn = require('opn');
const del = require('del');
const order = require('gulp-order');
const fileInclude = require('gulp-file-include');
const gulpIgnore = require('gulp-ignore');

gulp.task('connect', () => {
	connect.server({
		name: 'dev',
		root: ['demo', 'bower_components', 'locales'],
		port: 8080,
		livereload: true,
	});
});

gulp.task('watch', ['js', 'less', 'sprite'], () => {
	gulp.watch('src/js/*.js', ['js']);
	gulp.watch('src/less/*.less', ['less']);
	gulp.watch('src/img/*.png', ['sprite']);
	gulp.watch('demo/index.html', ['liveload']);
});

gulp.task('liveload', () => {
	gulp.src('demo/index.html')
		.pipe(connect.reload());
});

gulp.task('js', ['lint'], () => {
	gulp.src(['src/js/wrapper.js', 'src/js/main.js','src/js/QQMusic.js'])
		.pipe(plumber())
		.pipe(order([
			'QQMusic.js',
			'wrapper.js',
			'main.js'
		]))
		.pipe(fileInclude({
			prefix: '// @@',
			basepath: '@file'
		}))
		.pipe(concat('app.js'))
		// 如果开发浏览器不支持es6可以将下面的代码取消注释
		// .pipe(babel({
		// 	presets: ['es2015'],
		// }))
		.pipe(gulp.dest('demo/static/js'))
		.pipe(connect.reload());
});

gulp.task('lint', () => {
	gulp.src('src/js/*.js')
		.pipe(plumber())
		.pipe(eslint({
			configFile: '.eslintrc'
		}))
		.pipe(eslint.format());
});

gulp.task('less', () => {
	gulp.src('src/less/*.less')
		.pipe(less())
		.pipe(concat('main.css'))
		.pipe(autoPrefixer({
			browsers: ['chrome >= 20', 'ie > 8', 'firefox >= 20', 'android >= 2.3']
		}))
		.pipe(gulp.dest('demo/static/css'))
		.pipe(connect.reload());
});

gulp.task('default', ['watch', 'connect'], () => {
	opn('http://localhost:8080');
});

gulp.task('sprite', () => {
	let spriteData = gulp.src('src/img/*.png')
		.pipe(spritesmith({
			imgName: 'sprite.png',
			cssName: 'sprite.less',
			imgPath: '../img/sprite.png'
		}));
	spriteData.css
		.pipe(gulp.dest('src/less/'))
		.pipe(connect.reload());
	spriteData.img
		.pipe(gulp.dest('demo/static/img/'))
		.pipe(connect.reload());
});

gulp.task('build:js', ['lint'], () => {
	gulp.src('src/js/wrapper.js')
		.pipe(eslint({
			configFile: '.eslintrc'
		}))
		.pipe(eslint.failOnError())
		.pipe(gulpIgnore.exclude('src/js/wmplayer.js'))
		.pipe(fileInclude({
			prefix: '// @@',
			basepath: '@file',
			indent: true
		}))
		.pipe(babel({
			presets: ['es2015']
		}))
		.pipe(rename('wmplayer.js'))
		.pipe(gulp.dest('dist/js/'))
		.pipe(uglify())
		.pipe(rename('wmplayer.min.js'))
		.pipe(gulp.dest('dist/js/'));
});

gulp.task('build:css', () => {
	gulp.src('src/less/wmplayer.less')
		.pipe(less())
		.pipe(autoPrefixer({
			browsers: ['chrome >= 20', 'ie > 8', 'firefox >= 20', 'android >= 2.3']
		}))
		.pipe(gulp.dest('dist/css/'))
		.pipe(cleanCss({ compatibility: 'ie8' }))
		.pipe(rename('wmplayer.min.css'))
		.pipe(gulp.dest('dist/css/'));
});

gulp.task('build:sprite', () => {
	let spriteData = gulp.src('src/img/*.png')
		.pipe(spritesmith({
			imgName: 'sprite.png',
			cssName: 'sprite.less',
			imgPath: '../img/sprite.png'
		}));
	spriteData.css
		.pipe(gulp.dest('src/less/'));
	spriteData.img
		.pipe(gulp.dest('dist/img/'));
});

gulp.task('build', ['build:js', 'build:css', 'build:sprite']);

//TODO
gulp.task('clean', () => {
	gulp.src(['dist/*'])
		.pipe(del());
});