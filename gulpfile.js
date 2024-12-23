/// <binding ProjectOpened='build' />
'use strict';

const gulp = require('gulp');
// const fetch = require('node-fetch');
const path = require('path');

// HTML-related
const htmlmin = require('gulp-htmlmin');
const twig = require('gulp-twig');

// CSS-related
const sass = require('gulp-dart-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cleanCss = require('gulp-clean-css');
const del = require('del');

// JS-related
const concat = require('gulp-concat');
const minify = require('gulp-minify');
const include = require('gulp-include');

// Utility-related
const sourcemaps = require('gulp-sourcemaps');
const connect = require('gulp-connect');
const open = require('gulp-open');
const inject = require('gulp-inject-string');
const fs = require('fs');
const gulpReplace = require('gulp-replace');

const localhost = 'http://localhost:8080';

const roots = {
    src: './src',
    dist: './dist',
    libs: './src/libs'
};

const CDN_FILES = [
	{
		url: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/atom-one-dark.min.css',
		dest: './dist/temp/atom-one-dark.min.css'
	},
	{
		url: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/highlight.min.js',
		dest: './dist/temp/highlight.min.js'
	},
	{
		url: 'https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.14.0/beautify-html.min.js',
		dest: './dist/temp/beautify-html.min.js'
	}
];

// Task to fetch all CDN files
gulp.task('fetch-cdns', async function () {
	// Dynamically import node-fetch
	const fetch = (await import('node-fetch')).default;

	for (const file of CDN_FILES) {
		const { url, dest } = file;
		const dir = path.dirname(dest);

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		const response = await fetch(url);
		const fileStream = fs.createWriteStream(dest);

		await new Promise((resolve, reject) => {
			response.body.pipe(fileStream);
			response.body.on('error', reject);
			fileStream.on('finish', resolve);
		});

		console.log(`Downloaded: ${dest}`);
	}
});

const replace = function (search, str) {
  return stream(function(fileContents) {
    return fileContents.replace(new RegExp(search, 'g'), str);
  });
}

// Clean task
gulp.task('clean-dist', async function (done) {
    return del([
        `${roots.dist}/temp`
    ]);
});

// Move html to dist
gulp.task('html', function (done) {
    return gulp.src([`${roots.src}/index.html`])
        .pipe(gulp.dest(`${roots.dist}`))
        .pipe(connect.reload());
});

// Twig to HTML
gulp.task('twig', function (done) {
    return gulp.src([
            'src/_picture-tag-assembler-modal.twig',
            'src/_picture-tag-assembler-dialog.twig'
        ])
        .pipe(twig())
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest(`${roots.dist}/temp`))
});

// Creates JS sourcemaps, concatenates JS files into one file based on array above, and minifies JS
gulp.task('js', function (done) {
    
    // Save css string
    let cssFileContent = fs.readFileSync('dist/temp/picture-tag-assembler.css', 'utf8');
    let atomCSSFileContent = fs.readFileSync('dist/temp/atom-one-dark.min.css', 'utf8');
    
    // Save html string
    let modalFileContent = fs.readFileSync('dist/temp/_picture-tag-assembler-modal.html', 'utf8');
    let dialogFileContent = fs.readFileSync('dist/temp/_picture-tag-assembler-dialog.html', 'utf8');
        
    return gulp.src([`${roots.src}/js/picture-tag-assembler.js`], { sourcemaps: true })
        .pipe(include())
        .pipe(concat('picture-tag-assembler.js'))
        
        // Inject css string into js
        .pipe(inject.replace('//=inject picture-tag-assembler.css', cssFileContent.trim() ))
        .pipe(inject.replace('//=inject atom.css', atomCSSFileContent.trim() ))
        
        // Inject html string into js
        .pipe(inject.replace('//=inject _picture-tag-assembler-modal.html', modalFileContent.trim() ))
        .pipe(inject.replace('//=inject _picture-tag-assembler-dialog.html', dialogFileContent.trim() ))
        
        // Remove scss sourcemaps linkage from string
        .pipe(gulpReplace('/*# sourceMappingURL=picture-tag-assembler.css.map */', ''))
        
        .pipe(minify({
            ext: {
                min: ".min.js",
            },
                preserveComments: 'some'
            
        }))
        .pipe(gulp.dest(`${roots.dist}/js`, { sourcemaps: '.' }))
        .pipe(connect.reload());
});

// Creates Main CSS sourcemaps, converts SCSS to CSS, adds prefixes, and lints CSS
gulp.task('sass', function (done) {
    const plugins = [
        autoprefixer({ grid: true })
    ];

    return gulp.src([`${roots.src}/scss/picture-tag-assembler.scss`])
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(plugins))
        .pipe(cleanCss())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(`${roots.dist}/temp`))
        .pipe(connect.reload());
});

// Runs a server to static HTML files and sets up watch tasks
gulp.task('server', function (done) {
    gulp.watch((`${roots.src}/**/*.html`), gulp.series('html'));
    gulp.watch((`${roots.src}/scss/**/*.scss`), gulp.series('fetch-cdns', 'twig', 'sass', 'js', 'clean-dist'));
    gulp.watch((`${roots.src}/**/*.twig`), gulp.series('fetch-cdns', 'twig', 'sass', 'js', 'clean-dist'));
    gulp.watch((`${roots.src}/js/**/*`), gulp.series('fetch-cdns', 'twig', 'sass', 'js', 'clean-dist'));

    connect.server({
        root: roots.dist,
        livereload: true
    });

    setTimeout(function () {
        return gulp.src(__filename)
            .pipe(open({ uri: localhost }));
    }, 2000);

    done();
});

gulp.task('build', gulp.series('fetch-cdns', 'twig', 'sass', 'html', 'js', 'clean-dist'));

gulp.task('default', gulp.series('build', 'server', 'clean-dist'));
