const gulp = require('gulp'),
  del = require('del'),
  browserSync = require('browser-sync').create(),
  concat = require('gulp-concat'),
  sourcemaps = require('gulp-sourcemaps'),
  gulpif = require('gulp-if'),
  postcss = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'),
  cssnano = require('gulp-cssnano'),
  sortMediaQueries = require('postcss-sort-media-queries'),
  uglify = require('gulp-uglify'),
  babel = require('gulp-babel'),
  less = require('gulp-less'),
  rename = require("gulp-rename"),
  smartgrid = require('smart-grid');

// * smartgrid будет отдельным таском, который запускается вначале проекта и может быть ещё один или пару раз при каких-то изменениях. Поэтому в сборщик он не входит, а у него будет отдельный таск. 

// uncss = require('postcss-uncss'),

const devDir = './app/', buildDir = './dist/';

const jsFiles = [
  devDir + 'js/lib.js',
  devDir + 'js/index.js'
];

const isDev = process.argv.indexOf('--dev') !== -1,
  isProd = !isDev,
  isSync = process.argv.indexOf('--sync') !== -1;

function html() {
  return gulp.src(devDir + '*.html')
    .pipe(gulp.dest(buildDir))
    .pipe(gulpif(isSync, browserSync.stream()));
}

function styles() {
  return gulp.src(devDir + 'less/main.less')
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(less())
    .on('error', console.error.bind(console))
    .pipe(postcss(autoprefixer({
      overrideBrowserslist: ['> 0.1%']
    })))
    .pipe(postcss([
      sortMediaQueries({ sort: 'desktop-first' })
    ]))
    .pipe(gulpif(isProd, postcss(cssnano({ level: 2 }))))
    .pipe(gulpif(isDev, sourcemaps.write()))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(buildDir + 'css'))
    .pipe(gulpif(isSync, browserSync.stream()));
}

function scripts() {
  return gulp.src(jsFiles)
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(gulpif(isProd, babel({ presets: ['@babel/env'] })))
    .on('error', console.error.bind(console))
    .pipe(gulpif(isProd, uglify({ toplevel: true })))
    .pipe(concat('main.min.js'))
    .pipe(gulpif(isDev, sourcemaps.write()))
    .pipe(gulp.dest(buildDir + 'js'))
    .pipe(gulpif(isSync, browserSync.stream()));
}

function images() {
  return gulp.src(devDir + 'img/**/*')
    .pipe(gulp.dest(buildDir + 'img'))
    .pipe(gulpif(isSync, browserSync.stream()));
}

function fonts() {
  return gulp.src(devDir + 'fonts/**/*')
    .pipe(gulp.dest(buildDir + 'fonts/'))
    .pipe(gulpif(isSync, browserSync.stream()));
}

function clear() { return del(buildDir + '*'); }
function watch() {
  if (isSync) {
    browserSync.init({
      server: { baseDir: buildDir },
      notify: false
      // tunnel: true
    })
  };

  gulp.watch(devDir + 'less/**/*.less', styles)
  gulp.watch(devDir + 'js/**/*.js', scripts)
  gulp.watch(devDir + '*.html', html)
}

function grid(done) {
  const settings = {
    filename: "_smart-grid",
    columns: 5,
    offset: "40px",
    container: {
      maxWidth: "1600px",
      fields: "200px" 
    },
    breakPoints: {
      md: {
        width: "1000px",
        fields: "20px"
      },
      sm: {
        width: "768px",
        fields: "64px"
      },
      xs: {
        width: "480px",
        fields: "10px"
      },
      xxs: {
        width: "360px"
      }
    },
  }

  smartgrid('./app/less', settings);
  done();
}

const build = gulp.series(clear,
  gulp.parallel(html, styles, scripts, images, fonts)
);

gulp.task('build', build);
gulp.task('watch', gulp.series(build, watch));

gulp.task('grid', grid);