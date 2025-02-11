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

    // Process all pages in the pages directory
    const pagesDir = path.join(__dirname, '../src/content/pages');
    const pageFiles = fs.readdirSync(pagesDir)
        .filter(file => file !== 'index.md');  // Skip index.md as we're using a direct HTML file

    for (const file of pageFiles) {
        const filePath = path.join(pagesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(file, '.md');
        const title = fileName.charAt(0).toUpperCase() + fileName.slice(1); // Capitalize first letter
        
        const html = processMarkdown(content, template, title);
        
        // Create the output file (converting .md to .html)
        const outputPath = path.join(__dirname, '../public', `${fileName}.html`);
        fs.writeFileSync(outputPath, html);
    }
    
    console.log('Site built successfully!');
}

build().catch(console.error); 