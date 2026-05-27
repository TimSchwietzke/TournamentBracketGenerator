/**
 * build.js
 * Purpose: Compiles the separated development files in src/generator/ into a
 * single, self-contained tournament_generator.html file in the root.
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'generator');
const outputFilePath = path.join(__dirname, 'tournament_generator.html');

/**
 * Reads a file's content UTF-8 encoded.
 * @param {string} filePath - Absolute path to the file to read.
 * @returns {string} The content of the file.
 */
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file at ${filePath}:`, error.message);
        process.exit(1);
    }
}

/**
 * Combines index.html, style.css, and app.js into a single HTML string.
 * @param {string} html - HTML skeleton content.
 * @param {string} css - CSS styling content.
 * @param {string} js - Javascript logic content.
 * @returns {string} Completed self-contained HTML page.
 */
function inlineResources(html, css, js) {
    // We replace the link and script tags with inline style and script tags.
    // This allows the resulting file to be completely offline and shareable.
    const styledHtml = html.replace(
        '<link rel="stylesheet" href="style.css">',
        `<style>\n${css}\n</style>`
    );
    return styledHtml.replace(
        '<script src="app.js" defer></script>',
        `<script>\n${js}\n</script>`
    );
}

/**
 * Main build process orchestrator.
 */
function runBuild() {
    console.log('Compiling tournament_generator.html...');
    
    const html = readFile(path.join(srcDir, 'index.html'));
    const css = readFile(path.join(srcDir, 'style.css'));
    const js = readFile(path.join(srcDir, 'app.js'));
    
    const output = inlineResources(html, css, js);
    
    try {
        fs.writeFileSync(outputFilePath, output, 'utf8');
        console.log('Success! Single-file tournament_generator.html has been generated.');
    } catch (error) {
        console.error('Error writing output file:', error.message);
        process.exit(1);
    }
}

runBuild();
