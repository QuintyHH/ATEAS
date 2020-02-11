# ATEAS
Adobe Target Experience Automation Script

This tool is meant to accelerate the process of publishing experiences to Adobe Target.

It builds full .js files by concat-ing shared files (in the shared folder - a Qubit correspondent would be the triggers.js and utils.js files),
with the variation files (in the variations folders)

Let's assume (A) is Shared javascript files, and (B) and (C) are different variations. 
Running the tool would output 2 files, the first one being (AB) and the second one being (AC).

Initially, you need to install GULP globally on your machine, and install all the dependencies.

``` npm install gulp-cli -g && npm i ```

To start the tool, type:

``` gulp start ```

This will create sample files and scaffold folders for ease of use.
The Shared and Variations folders (and all subfolders) will accept .js, .css and .scss files.

To automate the min process, type:

``` gulp watch ```

This will iterate through all Shared folders and Variations folders and merge them according to the schema above.
Then it will turn all SCSS to CSS, write source maps, and concat them together. The output are 2 files: one minified version (for prod) and one unminified version (for debugging)

It will also take all the .js files, merge them according to the pattern, babelfy them, then minify them, and output 2 versions: one minified version (for prod) and one unminified version (for debugging)

To upload to the S3 bucket, type:

``` gulp upload ```

This will upload the dist files from the above process to the S3 bucket of your choice. This needs to be configured in the config object, and it takes in the Bucket URL, AccessToken, SecretToken, and Region.
It will also open Chrome to the Bucket URL.

To link these scripts to AT, simply write:

```<script src="bucketURL/whatever.js" id="experienceName"></script>```
