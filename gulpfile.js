// Init modules
const { src, dest, watch, series, parallel } = require("gulp");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const concat = require("gulp-concat");
const postcss = require("gulp-postcss");
const sass = require("gulp-sass");
const uglify = require("gulp-uglify");
const clean = require("gulp-clean");
const babel = require("gulp-babel");
var rename = require("gulp-rename");
var fs = require("fs");
var path = require("path");

// Helper functions
function getFolderName(dir) {
  return fs.readdirSync(dir);
}

function writeSamples(dir) {
  Object.values(sampleFiles).forEach(file => {
    fs.writeFile(`${dir}/${file}`, content, err => {
      console.log(`[ATEAS]: ${file} was succesfully created in ${dir}`);
    });
  });
}

// File variables
const folders = {
  src: "src",
  shared: "src/shared",
  variations: "src/variations/"
};

const sampleFiles = { js: "index.js", css: "style.css", scss: "style.scss" };
const content = `/* This is a sample file */`;

//Scaffolding Tasks
function scaffoldingFoldersTask() {
  const task = Object.values(folders).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      console.log("[ATEAS]: Folder created:", dir);
    }
  });
  return Promise.resolve(task);
}

function scaffoldingFilesTask() {
  const task = Object.values(folders).forEach(dir => {
    fs.readdir(dir, function(err, files) {
      if (!files.length) {
        if (dir == folders.shared) {
          writeSamples(dir);
        }

        if (dir == folders.variations) {
          let dirpath = `${dir}` + "/sampleVariation/";
          fs.mkdirSync(dirpath, { recursive: true });
          writeSamples(dirpath);
        }
      }
    });
  });
  return Promise.resolve(task);
}

// CSS tasks
function mergeCssTask() {
  let folderName = getFolderName(folders.variations);
  let tasks = folderName.map(function(filename) {
    exactname = path.basename(filename, ".css");
    return src([
      `${folders.shared}` + "/**/*.css",
      `${folders.shared}` + "/**/*.scss",
      `${folders.variations}/${filename}` + "/**/*.css",
      `${folders.variations}/${filename}` + "/**/*.scss"
    ])
      .pipe(sass())
      .pipe(concat(filename + ".unmin.css"))
      .pipe(dest(`dist/unmin/${exactname}`))
      .pipe(postcss([autoprefixer(), cssnano()]))
      .pipe(rename(filename + ".min.css"))
      .pipe(dest(`dist/min/${exactname}`));
  });
  return Promise.resolve(tasks);
}

// JS tasks
function mergeJSTask() {
  let folderName = getFolderName(folders.variations);
  let tasks = folderName.map(function(filename) {
    exactname = path.basename(filename, ".js");
    return src([
      `${folders.shared}` + "/**/*.js",
      `${folders.variations}/${filename}` + "/**/*.js"
    ])
      .pipe(concat(filename + ".unmin.js"))
      .pipe(dest(`dist/unmin/${exactname}`))
      .pipe(
        babel({
          presets: ["@babel/env"]
        })
      )
      .pipe(uglify())
      .pipe(rename(filename + ".min.js"))
      .pipe(dest(`dist/min/${exactname}`));
  });
  return Promise.resolve(tasks);
}

// Watch task
function watchTask() {
  watch(
    [folders.src],
    series(
      cleanDist,
      scaffoldingFoldersTask,
      scaffoldingFilesTask,
      parallel(mergeCssTask, mergeJSTask)
    )
  );
  return Promise.resolve(
    console.log("[ATEAS]: Watching for changes in the 'src' folder.")
  );
}

// Clean tasks
function cleanDist() {
  const ts = Date.now();
  return src("dist")
    .pipe(rename(`dist-[${ts}]`))
    .pipe(dest("."))
    .pipe(clean());
}

// Default task
exports.default = series(
  scaffoldingFoldersTask,
  scaffoldingFilesTask,
  parallel(mergeCssTask, mergeJSTask),
  watchTask
);
