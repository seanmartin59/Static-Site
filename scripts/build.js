const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');

// Ensure build directories exist
fs.ensureDirSync(path.join(__dirname, '../public'));
fs.ensureDirSync(path.join(__dirname, '../src/content/pages'));
fs.ensureDirSync(path.join(__dirname, '../src/content/blog'));
fs.ensureDirSync(path.join(__dirname, '../src/templates'));
fs.ensureDirSync(path.join(__dirname, '../src/styles'));
fs.ensureDirSync(path.join(__dirname, '../src/scripts'));

// Read the template file
function getTemplate() {
    const templatePath = path.join(__dirname, '../src/templates/base.html');
    return fs.readFileSync(templatePath, 'utf-8');
}

// Convert markdown to HTML and inject into template
function processMarkdown(markdown, template, title) {
    const htmlContent = marked.parse(markdown);
    return template
        .replace('{{title}}', title)
        .replace('{{content}}', htmlContent);
}

async function build() {
    // Copy static assets
    await fs.copy(path.join(__dirname, '../src/styles'), path.join(__dirname, '../public/styles'));
    await fs.copy(path.join(__dirname, '../src/scripts'), path.join(__dirname, '../public/scripts'));
    
    // Get the template
    const template = getTemplate();

    // Process index page
    const indexPath = path.join(__dirname, '../src/content/pages/index.md');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const indexHtml = processMarkdown(indexContent, template, 'Home');
    
    // Write the processed index.html
    fs.writeFileSync(path.join(__dirname, '../public/index.html'), indexHtml);
    
    console.log('Site built successfully!');
}

build().catch(console.error); 