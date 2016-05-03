var assetPath = './src/public/';
var gulp = require('gulp'),
  browserSync = require('browser-sync');
/*css*/
var postcss = require('gulp-postcss');
var cssImport = require('postcss-import');
var simplevars = require('postcss-simple-vars');
var autoprefixer = require('autoprefixer');
var mqpacker = require('css-mqpacker');//归类media
var cssnano = require('cssnano');//压缩css
var nestedcss = require('postcss-nested');//css嵌套
var mixins = require('postcss-mixins');//类
var px2rem = require('postcss-px2rem');
var spriteCss = require('gulp-css-spriter');
/*js*/
var jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  concat = require('gulp-concat');
/*html*/
var processhtml = require('gulp-processhtml'),
  htmlmin = require('gulp-htmlmin');
/*img*/
var imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  cache = require('gulp-cache');
/*版本控制*/
var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');

/*其余插件*/
var notify = require('gulp-notify');
var del = require('del');

gulp.task(browsersync);
gulp.task(css);

function browsersync() {
    browserSync({ 
      // proxy: 'http://localhost:8080/zhibei2/web/src/' //利用tomcat或其他服务器
      server: {	//browsersync内置
      	baseDir: "./src/"
      }
    });
    gulp.watch(['./src/public/precss/*.css','./src/public/precss/part/*.css']).on('change', gulp.series(
        css, browserSync.reload
        ));
    gulp.watch(['./src/*.jsp','./src/*.html','./src/public/js/*.js']).on('change', browserSync.reload);
}
function css() {
    var processors = [
  		cssImport,
      mixins,//Note, that you must set this plugin before postcss-simple-vars and postcss-nested.
      simplevars,
      nestedcss,
      // px2rem({remUnit: 64}),mobile
      autoprefixer,
      mqpacker,
    ];
    // var processors2 = [
    //   cssnano({discardComments: {removeAll: true}})
    // ]
    return gulp.src('./src/public/precss/*.css')
        .pipe(postcss(processors))
        .pipe(spriteCss({
  	      //生成的sprite的位置
  	      'spriteSheet': './src/public/img/sprite.png',
  	      //生成样式的文件图片引用路径
  	      'pathToSpriteSheetFromCSS': '../img/sprite.png'
  	    }))
        // .pipe(postcss(processors2))
        .pipe(gulp.dest('./src/public/css'));
}
function compileCss(){
    var processors2 = [
      cssnano({discardComments: {removeAll: true}})
    ];
    return gulp.src(['src/rev/**/*.json','./src/public/css/*.css'])
        .pipe(revCollector())
        .pipe(postcss(processors2))
        .pipe(rev())
        .pipe(gulp.dest('./dist/public/css'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('src/rev/css'))
        .pipe(notify({
          message: 'compileCss task complete'
        }));
}
function compileJs(){
  return gulp.src('./src/public/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(uglify())
    .pipe(concat('all.js'))
    .pipe(rev())
    .pipe(gulp.dest('./dist/public/js'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('src/rev/js'))
    .pipe(notify({
      message: 'compileJs task complete'
    }));
}
function miniImg() {
  return gulp.src('src/public/img/*.{png,jpg,gif,svg}')
    .pipe(rev())
    .pipe(imagemin({
      progressive: true,
      use: [pngquant({quality: '65-80'})]
    }))
    .pipe(gulp.dest('dist/public/img'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('src/rev/img'))
    .pipe(notify({
      message: 'miniImg task complete'
    }));
}
function revFont() {
  return gulp.src('src/public/fonts/*')
    .pipe(rev())
    .pipe(gulp.dest('dist/public/fonts'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('src/rev/fonts'))
    .pipe(notify({
      message: 'revFont task complete'
    }));
}
function compileHtml(){
  return gulp.src(['src/rev/**/*.json', 'src/*.{html,jsp}'])
    .pipe(processhtml())
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(revCollector())
    .pipe(gulp.dest('./dist'))
    .pipe(notify({
      message: 'compileHtml task complete'
    }));    
}
function cleanDist(cb) {
  return del('dist', cb);
}
gulp.task('reversion', gulp.series(
   gulp.parallel(miniImg, revFont),
  gulp.parallel(compileCss, compileJs)
  
));

gulp.task('dist', gulp.series(
   cleanDist,
  'reversion',
  compileHtml
));
