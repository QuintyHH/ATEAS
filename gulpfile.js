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

// File variables
function getFolderName(dir) {
  return fs.readdirSync(dir);
}

const filePaths = {
  basePath: "src",
  sharedJsPath: "src/shared/**/*.js",
  variationJsPath: "src/variations/",
  sharedScssPath: "src/shared/**/*.scss",
  sharedCssPath: "src/shared/**/*.css",
  variationScssPath: "src/variations/",
  variationCssPath: "src/variations/",
  tempCssPath: "dist/temp/**/*.css"
};

const folders = {
  src: "src",
  shared: "src/shared",
  variations: "src/variations/"
};

const sampleFiles = ["style.css", "index.js", "style.scss"];
const content = `/* This is a sample file */`;

//Scaffolding Tasks
function scaffoldingFoldersTask() {
  return Promise.resolve(
    Object.values(folders).forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        console.log("[ATEAS]: Folder created:", dir);
      }
    })
  );
}

function scaffoldingFilesTask() {
  return Promise.resolve(
    Object.values(folders).forEach(dir => {
      fs.readdir(dir, function(err, files) {
        if (!files.length) {
          if (dir == folders.shared) {
            sampleFiles.forEach(file => {
              fs.writeFile(`${dir}/${file}`, content, err => {
                console.log(
                  `[ATEAS]: ${file} was succesfully created in ${dir}`
                );
              });
            });
          }

          if (dir == folders.variations) {
            let dirpath = `${dir}sampleVariation/`;
            fs.mkdirSync(dirpath, { recursive: true });
            sampleFiles.forEach(file => {
              fs.writeFile(`${dirpath}/${file}`, content, err => {
                console.log(
                  `[ATEAS]: ${file} was succesfully created in ${dirpath}`
                );
              });
            });
          }
        }
      });
    })
  );
}

// CSS tasks
function mergeCssTask() {
  let folderName = getFolderName(filePaths.variationJsPath);
  let tasks = folderName.map(function(filename) {
    exactname = path.basename(filename, ".css");
    return src([
      filePaths.sharedCssPath,
      `${filePaths.variationCssPath}/${filename}` + "/*.css",
      `${filePaths.variationCssPath}/${filename}` + "/**/*.css",
      filePaths.sharedScssPath,
      `${filePaths.variationCssPath}/${filename}` + "/*.scss",
      `${filePaths.variationCssPath}/${filename}` + "/**/*.scss"
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
  let folderName = getFolderName(filePaths.variationJsPath);
  let tasks = folderName.map(function(filename) {
    exactname = path.basename(filename, ".js");
    return src([
      filePaths.sharedJsPath,
      `${filePaths.variationJsPath}/${filename}/*.js`,
      `${filePaths.variationJsPath}/${filename}/**/*.js`
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
    [filePaths.basePath],
    series(
      cleanDist,
      scaffoldingFoldersTask,
      scaffoldingFilesTask,
      mergeCssTask,
      mergeJSTask
    )
  );
  return Promise.resolve(
    console.log(
      "-----------------------------------------------------------------"
    ),
    console.log(
      "| ATEAS will now start watching for changes in the 'src' folder. |"
    ),
    console.log(
      "------------------------------------------------------------------"
    )
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
  mergeCssTask,
  mergeJSTask,
  watchTask
);
