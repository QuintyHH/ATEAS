// Init modules
const { src, dest, watch, series, parallel } = require("gulp"),
  autoprefixer = require("autoprefixer"),
  cssnano = require("cssnano"),
  concat = require("gulp-concat"),
  postcss = require("gulp-postcss"),
  sass = require("gulp-sass"),
  uglify = require("gulp-uglify"),
  clean = require("gulp-clean"),
  babel = require("gulp-babel"),
  rename = require("gulp-rename"),
  fs = require("fs"),
  path = require("path"),
  imageMin = require("gulp-imagemin"),
  converter = require("csvtojson")

// Helper functions
function getFolderName(dir) {
  return fs.readdirSync(dir)
}

function writeSamples(dir) {
  Object.values(sampleFiles).forEach(file => {
    fs.writeFile(`${dir}/${file}`, content, err => {
      console.log(`[ATEAS]: ${file} was succesfully created in ${dir}.`)
    })
  })
}

// File variables
const options = { auto_parse: true }
const folders = {
    src: "src",
    shared: "src/shared",
    variations: "src/variations/",
    images: "src/images/",
    datasets: "src/datasets/",
    assets: "assets",
    procData: "assets/datasets/",
    procImg: "assets/images/"
  },
  sampleFiles = { js: "index.js", css: "style.css", scss: "style.scss" },
  content = `/* This is a sample file */`

//Scaffolding Tasks
function scaffoldingFoldersTask() {
  const task = Object.values(folders).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
      console.log(`[ATEAS]: Folder created: ${dir}.`)
    }
  })
  return Promise.resolve(task)
}

function scaffoldingFilesTask() {
  const task = Object.values(folders).forEach(dir => {
    fs.readdir(dir, function(err, files) {
      if (!files.length) {
        if (dir == folders.shared) {
          writeSamples(dir)
        }

        if (dir == folders.variations) {
          let dirpath = `${dir}` + "/sampleVariation/"
          fs.mkdirSync(dirpath, { recursive: true })
          writeSamples(dirpath)
        }
      }
    })
  })
  return Promise.resolve(task)
}

// CSS tasks
function mergeCssTask() {
  let folderName = getFolderName(folders.variations)
  let tasks = folderName.map(function(filename) {
    exactname = path.basename(filename, ".css")
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
      .pipe(dest(`dist/min/${exactname}`))
  })
  return Promise.resolve(tasks)
}

// JS tasks
function mergeJSTask() {
  let folderName = getFolderName(folders.variations)
  let tasks = folderName.map(function(filename) {
    exactname = path.basename(filename, ".js")
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
      .pipe(dest(`dist/min/${exactname}`))
  })
  return Promise.resolve(tasks)
}

// Watch task
function watchTask() {
  watch(
    [folders.src],
    series(backUpTask, cleanTask, parallel(mergeCssTask, mergeJSTask))
  )
  return Promise.resolve(
    console.log(`[ATEAS]: Watching for changes in the '${folders.src}' folder.`)
  )
}

// Image task
function images() {
  const task = src(`${folders.images}` + "*")
    .pipe(
      imageMin({
        progressive: true,
        optimizationLevel: 7, // 0-7 low-high
        interlaced: true,
        svgoPlugins: [{ removeViewBox: false }]
      })
    )
    .pipe(dest(folders.procImg))
  console.log("[ATEAS]: Images processed and minified.")
  return Promise.resolve(task)
}

// Dataset task
function writeJSON() {
  if (!fs.existsSync(folders.procData)) {
    fs.mkdirSync(folders.procData)
    console.log(`[ATEAS]: Folder created: ${folders.procData}.`)
  }
  let folderName = getFolderName(folders.datasets)
  let task = folderName.forEach(file => {
    let fileSplit = file.split(".")
    let fileType = fileSplit[fileSplit.length - 1]
    if (fileType === "csv") {
      let fileName = fileSplit[0]
      converter()
        .fromFile(folders.datasets + fileName + ".csv")
        .then(source => {
          fs.writeFileSync(
            folders.procData + fileName + ".json",
            JSON.stringify(source)
          )
        })
    }
  })

  return Promise.resolve(task)
}

// Clean tasks
function backUpTask() {
  const ts = Date.now()
  return src("dist/**/").pipe(dest(`dist [${ts}]`))
}

function cleanTask() {
  return src("dist/**/").pipe(clean())
}

// Default task
exports.clean = series(backUpTask, cleanTask)
exports.start = series(scaffoldingFoldersTask, scaffoldingFilesTask)
exports.watch = series(parallel(mergeCssTask, mergeJSTask), watchTask)
exports.images = series(images)
exports.datasets = series(writeJSON)
