const gulp = require('gulp');
const eslint = require('gulp-eslint'); // lint ts
const typescript = require('rollup-typescript'); // build ts
const rollup = require('gulp-rollup'); // bundle js
const stylus = require('gulp-stylus'); // build css
const postcss = require('gulp-postcss'); // transform css
const autoprefixer = require('autoprefixer'); // auto add prefix
const cssnano = require('cssnano'); // compress css
const spritesmith = require('gulp.spritesmith'); // build sprite image
const yaml = require('gulp-yaml'); // build locale
const browserSync = require('browser-sync').create(); // start dev server
const plumber = require('gulp-plumber'); // error handle
const opn = require('opn'); // open website
const del = require('del'); // delete file
const ignore = require('gulp-ignore'); // ignore file
const rename = require('gulp-rename'); // rename file
const notify = require("gulp-notify"); // send system notification

function reload (done) {
	browserSync.reload();
	done();
}

gulp.task('lint', () => {
	return gulp.src('src/script/*.ts')
		.pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('watch:html', gulp.series(() => {
	return gulp.src('src/index.html')
		.pipe(gulp.dest('demo/'))
}, reload));

gulp.task('watch:script', gulp.series('lint', () => {
	return gulp.src('src/script/*.ts')
		.pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
		.pipe(rollup({
			allowRealFiles: true,
			input: "src/script/main.ts",
			output: {
				format: "cjs"
			},
			plugins: [
				typescript()
			]
		}))
		.pipe(rename('app.js'))
		.pipe(gulp.dest('demo/js'))
}, reload));

gulp.task('watch:style', gulp.series(() => {
	return gulp.src('src/style/*.styl')
		.pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
		.pipe(ignore('sprite.styl'))
		.pipe(stylus())
		.pipe(postcss([
			autoprefixer({
				browsers: ['chrome >= 20', 'ie > 8', 'firefox >= 20', 'android >= 2.3']
			})
		]))
		.pipe(gulp.dest('demo/css'))
}, reload));

gulp.task('watch:sprite', gulp.series(() => {
	let spriteData = gulp.src('src/image/*.png')
		.pipe(spritesmith({
			imgName: 'sprite.png',
			cssName: 'sprite.styl',
			imgPath: '../image/sprite.png'
		}));
	spriteData.css
		.pipe(gulp.dest('src/style'));
	spriteData.img
		.pipe(gulp.dest('demo/image'));
	return spriteData;
}, reload));

gulp.task('watch:locale', gulp.series(() => {
	return gulp.src('src/locale/*.yaml')
		.pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
		.pipe(yaml({
			safe: false
		}))
		.pipe(gulp.dest('demo/locales'))
}, reload));

gulp.task('build:js', gulp.series(('lint'), () => {

}));

gulp.task('build:css', () => {

});

gulp.task('build:sprite', () => {
	let spriteData = gulp.src('src/image/*.png')
		.pipe(spritesmith({
			imgName: 'sprite.png',
			cssName: 'sprite.less',
			imgPath: '../img/sprite.png'
		}));
	spriteData.css
		.pipe(gulp.dest('src/less/'));
	spriteData.img
		.pipe(gulp.dest('dist/img/'));
	return spriteData;
});

gulp.task('build:locale', () => {

});

gulp.task('build', gulp.parallel('build:js', 'build:css', 'build:sprite', 'build:locale'));

gulp.task('server', () => {
	return new Promise(resolve => {
		browserSync.init({
			server: 'demo',
			port: 8091,
			middleware: [require('./app/app')]
		});
		resolve();
	})

});

gulp.task('clean', () => {
	return gulp.src(['dist/*'])
		.pipe(del());
});

gulp.task('watch', gulp.series(gulp.parallel('watch:script', 'watch:style', 'watch:sprite', 'watch:html', 'watch:locale'), () => {
	return new Promise(resolve => {
		gulp.watch('src/script/*.ts', gulp.series('watch:script'));
		gulp.watch('src/style/*.styl', gulp.series('watch:style'));
		gulp.watch('src/img/*.png', gulp.series('watch:sprite'));
		gulp.watch('src/index.html', gulp.series('watch:html'));
		gulp.watch('src/locale/*.yaml', gulp.series('watch:locale'));
		resolve();
	})
}));

gulp.task('default', gulp.series(gulp.parallel('watch', 'server'), () => {
	// return opn('http://localhost:8091');
}));
