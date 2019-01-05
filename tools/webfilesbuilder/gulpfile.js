var gulp = require('gulp');
var fs = require('fs');
var concat = require('gulp-concat');
var gzip = require('gulp-gzip');
var flatmap = require('gulp-flatmap');
var path = require('path');
var htmlmin = require('gulp-htmlmin');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');

gulp.task('esprcmjsminify', gulp.series(function F1() {
        return gulp.src('../../src/websrc/js/esprcm.js')
        .pipe(uglify())
        .pipe(gulp.dest('../../src/websrc/gzipped/js/'));
}));

gulp.task("esprcmjsgz", gulp.series('esprcmjsminify', function F2() {
    return gulp.src("../../src/websrc/gzipped/js/esprcm.js")
        .pipe(gzip({
            append: true
        }))
    .pipe(gulp.dest('../../src/websrc/gzipped/js/'));
}));

gulp.task('esprcmjsgzh', gulp.series("esprcmjsgz" , function F3(cc) {
    var source = "../../src/websrc/gzipped/js/" + "esprcm.js.gz";
    var destination = "../../src/webh/" + "esprcm.js.gz.h";
    var wstream = fs.createWriteStream(destination);
    wstream.on('error', function (err) {
        console.log(err);
    });
    var data = fs.readFileSync(source);
    wstream.write('#define esprcm_js_gz_len ' + data.length + '\n');
    wstream.write('const uint8_t esprcm_js_gz[] PROGMEM = {')
    for (i=0; i<data.length; i++) {
        if (i % 1000 == 0) wstream.write("\n");
        wstream.write('0x' + ('00' + data[i].toString(16)).slice(-2));
        if (i<data.length-1) wstream.write(',');
    }
    wstream.write('\n};')
    wstream.end();
    cc();
}));

gulp.task('scripts_concat', gulp.series("esprcmjsgzh", function F4() {
    return gulp.src(['../../src/websrc/3rdparty/js/jquery-1.12.4.min.js', '../../src/websrc/3rdparty/js/bootstrap-3.3.7.min.js', '../../src/websrc/3rdparty/js/footable-3.1.6.min.js', '../../src/websrc/3rdparty/js/ion.rangeSlider.js'])
        .pipe(concat({
            path: 'required.js',
            stat: {
                mode: 0666
            }
        }))
        .pipe(gulp.dest('../../src/websrc/js/'))
        .pipe(gzip({
            append: true
        }))
        .pipe(gulp.dest('../../src/websrc/gzipped/js/'));
        //cd();
}));

gulp.task("scripts", gulp.series("scripts_concat", function F5(ce) {

    var source = "../../src/websrc/gzipped/js/" + "required.js.gz";
    var destination = "../../src/webh/" + "required.js.gz.h";
 
    var wstream = fs.createWriteStream(destination);
    wstream.on('error', function (err) {
        console.log(err);
    });
 
    var data = fs.readFileSync(source);
 
    wstream.write('#define required_js_gz_len ' + data.length + '\n');
    wstream.write('const uint8_t required_js_gz[] PROGMEM = {')
 
    for (i=0; i<data.length; i++) {
        if (i % 1000 == 0) wstream.write("\n");
        wstream.write('0x' + ('00' + data[i].toString(16)).slice(-2));
        if (i<data.length-1) wstream.write(',');
    }
 
    wstream.write('\n};')
    wstream.end();
    ce();
	
}));


gulp.task('esprcmcssminify', gulp.series(function F1a() {
        return gulp.src('../../src/websrc/css/esprcm.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('../../src/websrc/gzipped/css/'));
}));

gulp.task("esprcmcssgz", gulp.series('esprcmcssminify', function F2a() {
    return gulp.src("../../src/websrc/gzipped/css/esprcm.css")
        .pipe(gzip({
            append: true
        }))
    .pipe(gulp.dest('../../src/websrc/gzipped/css/'));
}));

gulp.task('esprcmcssgzh', gulp.series("esprcmcssgz" , function F3a(cc) {
    var source = "../../src/websrc/gzipped/css/" + "esprcm.css.gz";
    var destination = "../../src/webh/" + "esprcm.css.gz.h";
    var wstream = fs.createWriteStream(destination);
    wstream.on('error', function (err) {
        console.log(err);
    });
    var data = fs.readFileSync(source);
    wstream.write('#define esprcm_css_gz_len ' + data.length + '\n');
    wstream.write('const uint8_t esprcm_css_gz[] PROGMEM = {')
    for (i=0; i<data.length; i++) {
        if (i % 1000 == 0) wstream.write("\n");
        wstream.write('0x' + ('00' + data[i].toString(16)).slice(-2));
        if (i<data.length-1) wstream.write(',');
    }
    wstream.write('\n};')
    wstream.end();
    cc();
}));


gulp.task('styles_concat', gulp.series("esprcmcssgzh", function F6() {
    return gulp.src(['../../src/websrc/3rdparty/css/bootstrap-3.3.7.min.css', '../../src/websrc/3rdparty/css/footable.bootstrap-3.1.6.min.css', '../../src/websrc/3rdparty/css/sidebar.css', '../../src/websrc/3rdparty/css/ion.rangeSlider.min.css'])
        .pipe(concat({
            path: 'required.css',
            stat: {
                mode: 0666
            }
        }))
        .pipe(gulp.dest('../../src/websrc/css/'))
        .pipe(gzip({
            append: true
        }))
        .pipe(gulp.dest('../../src/websrc/gzipped/css/'));
}));



gulp.task("styles", gulp.series("styles_concat", function F7(cf) {

    var source = "../../src/websrc/gzipped/css/" + "required.css.gz";
    var destination = "../../src/webh/" + "required.css.gz.h";
 
    var wstream = fs.createWriteStream(destination);
    wstream.on('error', function (err) {
        console.log(err);
    });
 
    var data = fs.readFileSync(source);
 
    wstream.write('#define required_css_gz_len ' + data.length + '\n');
    wstream.write('const uint8_t required_css_gz[] PROGMEM = {')
 
    for (i=0; i<data.length; i++) {
        if (i % 1000 == 0) wstream.write("\n");
        wstream.write('0x' + ('00' + data[i].toString(16)).slice(-2));
        if (i<data.length-1) wstream.write(',');
    }
 
    wstream.write('\n};')
    wstream.end();
    cf();
	
}));


gulp.task("fontgz", gulp.series(function F8() {
	return gulp.src("../../src/websrc/3rdparty/fonts/*.*")
	.pipe(gulp.dest("../../src/websrc/fonts/"))
        .pipe(gzip({
            append: true
        }))
    .pipe(gulp.dest('../../src/websrc/gzipped/fonts/'));
}));

gulp.task("fonts", gulp.series("fontgz", function F9() {
    return gulp.src("../../src/websrc/gzipped/fonts/*.*")
        .pipe(flatmap(function(stream, file) {
			var filename = path.basename(file.path);
            var wstream = fs.createWriteStream("../../src/webh/" + filename + ".h");
            wstream.on("error", function(err) {
                gutil.log(err);
            });
			var data = file.contents;
            wstream.write("#define " + filename.replace(/\.|-/g, "_") + "_len " + data.length + "\n");
            wstream.write("const uint8_t " + filename.replace(/\.|-/g, "_") + "[] PROGMEM = {")
            
            for (i = 0; i < data.length; i++) {
                if (i % 1000 == 0) wstream.write("\n");
                wstream.write('0x' + ('00' + data[i].toString(16)).slice(-2));
                if (i < data.length - 1) wstream.write(',');
            }

            wstream.write("\n};")
            wstream.end();

            return stream;
        }));
}));

gulp.task('htmlsprep', gulp.series(function FA() {
    return gulp.src('../../src/websrc/*.htm*')
        .pipe(htmlmin({collapseWhitespace: true, minifyJS: true}))
        .pipe(gulp.dest('../../src/websrc/gzipped/'))
        .pipe(gzip({
            append: true
        }))
        .pipe(gulp.dest('../../src/websrc/gzipped/'));
}));

gulp.task("htmlsgz", gulp.series("htmlsprep", function FB() {
    return gulp.src("../../src/websrc/*.htm*")
        .pipe(gzip({
            append: true
        }))
    .pipe(gulp.dest('../../src/websrc/gzipped/'));
}));

gulp.task("htmls", gulp.series("htmlsgz", function FC() {
    return gulp.src("../../src/websrc/gzipped/*.gz")
        .pipe(flatmap(function(stream, file) {
            var filename = path.basename(file.path);
            var wstream = fs.createWriteStream("../../src/webh/" + filename + ".h");
            wstream.on("error", function(err) {
                gutil.log(err);
            });
            var data = file.contents;
            wstream.write("#define " + filename.replace(/\.|-/g, "_") + "_len " + data.length + "\n");
            wstream.write("const uint8_t " + filename.replace(/\.|-/g, "_") + "[] PROGMEM = {")
            
            for (i = 0; i < data.length; i++) {
                if (i % 1000 == 0) wstream.write("\n");
                wstream.write('0x' + ('00' + data[i].toString(16)).slice(-2));
                if (i < data.length - 1) wstream.write(',');
            }

            wstream.write("\n};")
            wstream.end();

            return stream;
        }));
}));


gulp.task('default', gulp.series(['scripts', 'styles', "fonts", "htmls"]));


