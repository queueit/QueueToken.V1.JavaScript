const {src, dest, series} = require("gulp");
const jsonModify = require('gulp-json-modify')

exports.stripPackage = () => {
    return src(['./package.json'])
        .pipe(jsonModify({key: 'devDependencies', value: {}}))
        .pipe(jsonModify({key: 'scripts', value: {}}))
        .pipe(dest('./'))
}