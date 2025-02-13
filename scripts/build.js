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
fs.ensureDirSync(path.join(__dirname, '../public/blog'));
fs.ensureDirSync(path.join(__dirname, '../public/images'));

// Read the template file
function getTemplate() {
    const templatePath = path.join(__dirname, '../src/templates/base.html');
    return fs.readFileSync(templatePath, 'utf-8');
}

// Read the blog template
function getBlogTemplate() {
    const templatePath = path.join(__dirname, '../src/templates/blog.html');
    return fs.readFileSync(templatePath, 'utf-8');
}

// Read the blog list template
function getBlogListTemplate() {
    const templatePath = path.join(__dirname, '../src/templates/blog-list.html');
    return fs.readFileSync(templatePath, 'utf-8');
}

// Convert markdown to HTML and inject into template
function processMarkdown(markdown, template, title) {
    const htmlContent = marked.parse(markdown);
    return template
        .replace('{{title}}', title)
        .replace('{{content}}', htmlContent);
}

// Process blog post frontmatter
function processFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) return { metadata: {}, content };
    
    const frontmatter = match[1];
    const actualContent = match[2];
    
    const metadata = {};
    frontmatter.split('\n').forEach(line => {
        const [key, value] = line.split(': ');
        if (key && value) {
            metadata[key.trim()] = value.trim();
        }
    });
    
    return { metadata, content: actualContent };
}

async function build() {
    // Clean the public directory first
    await fs.emptyDir(path.join(__dirname, '../public'));
    
    // Ensure all source directories exist
    fs.ensureDirSync(path.join(__dirname, '../src/styles'));
    fs.ensureDirSync(path.join(__dirname, '../src/scripts'));
    fs.ensureDirSync(path.join(__dirname, '../src/images'));
    
    // Ensure all public directories exist
    fs.ensureDirSync(path.join(__dirname, '../public/styles'));
    fs.ensureDirSync(path.join(__dirname, '../public/scripts'));
    fs.ensureDirSync(path.join(__dirname, '../public/images'));
    
    // Copy static assets if they exist
    const copyIfExists = async (src, dest) => {
        if (fs.existsSync(src)) {
            await fs.copy(src, dest);
        }
    };

    await copyIfExists(
        path.join(__dirname, '../src/styles'), 
        path.join(__dirname, '../public/styles')
    );
    await copyIfExists(
        path.join(__dirname, '../src/scripts'), 
        path.join(__dirname, '../public/scripts')
    );
    await copyIfExists(
        path.join(__dirname, '../src/images'), 
        path.join(__dirname, '../public/images')
    );
    
    // Copy index.html if it exists in src, otherwise create a basic one
    const srcIndexPath = path.join(__dirname, '../src/index.html');
    const publicIndexPath = path.join(__dirname, '../public/index.html');
    
    if (fs.existsSync(srcIndexPath)) {
        await fs.copy(srcIndexPath, publicIndexPath);
    } else {
        // Create a basic index.html using the base template
        const baseTemplate = getTemplate();
        const indexHtml = baseTemplate
            .replace('{{title}}', 'Home')
            .replace('{{content}}', `
                <div class="hero">
                    <h1>Welcome to Sean Martin</h1>
                    <p class="description">Explore articles about habits, decision making, and continuous improvement.</p>
                </div>
            `);
        fs.writeFileSync(publicIndexPath, indexHtml);
    }
    
    // Get templates
    const baseTemplate = getTemplate();
    const blogTemplate = getBlogTemplate();

    // Process all pages in the pages directory
    const pagesDir = path.join(__dirname, '../src/content/pages');
    const pageFiles = fs.readdirSync(pagesDir)
        .filter(file => file !== 'index.md');  // Skip index.md as we're using a direct HTML file

    for (const file of pageFiles) {
        const filePath = path.join(pagesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(file, '.md');
        const title = fileName.charAt(0).toUpperCase() + fileName.slice(1); // Capitalize first letter
        
        const html = processMarkdown(content, baseTemplate, title);
        
        // Create the output file (converting .md to .html)
        const outputPath = path.join(__dirname, '../public', `${fileName}.html`);
        fs.writeFileSync(outputPath, html);
    }
    
    // Process blog posts
    const blogDir = path.join(__dirname, '../src/content/blog');
    const blogFiles = fs.readdirSync(blogDir);
    
    // Create blog output directory
    const blogOutputDir = path.join(__dirname, '../public/blog');
    fs.ensureDirSync(blogOutputDir);

    // Collect blog post data for the listing page
    const blogPosts = [];

    for (const file of blogFiles) {
        const filePath = path.join(blogDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Process frontmatter and content
        const { metadata, content: postContent } = processFrontmatter(content);
        const htmlContent = marked.parse(postContent);
        
        // Store blog post data
        const fileName = path.basename(file, '.md');
        // Remove quotes and properly format the title
        const title = metadata.title ? metadata.title.replace(/^"|"$/g, '') : fileName.replace(/-/g, ' ');
        
        blogPosts.push({
            title: title,
            date: metadata.date || '',
            url: `/blog/${fileName}.html`
        });
        
        // Generate individual blog post pages
        let html = blogTemplate
            .replace('{{title}}', title)
            .replace('{{date}}', metadata.date || '')
            .replace('{{content}}', htmlContent);
        
        const outputPath = path.join(blogOutputDir, `${fileName}.html`);
        fs.writeFileSync(outputPath, html);
    }

    // Generate blog listing page
    const blogListTemplate = getBlogListTemplate();
    const blogListContent = blogPosts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(post => `
            <div class="blog-post-preview">
                <h2><a href="${post.url}">${post.title}</a></h2>
                <div class="blog-post-meta">${post.date}</div>
            </div>
        `)
        .join('');

    const blogListHtml = blogListTemplate.replace('{{blog_posts}}', blogListContent);
    fs.writeFileSync(path.join(__dirname, '../public/blog/index.html'), blogListHtml);
    
    console.log('Site built successfully!');
}

build().catch(console.error); 