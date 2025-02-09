# Simple Static Site Generator

A lightweight static site generator that converts Markdown to HTML, with a blog, landing page, and information pages.

## Project Structure

## Plan

1. Make a simple landing page
2. Make a template for a blog post
3. Make a Markdown --> HTML converter. This will allow us to write in Markdown and have it converted to HTML. Our static site generator will use this to convert our Markdown files to HTML.
4. Simple integration for ConvertKit, which will allow us to collect and send emails to our subscribers.
5. Make a simple contact form.

## Setup

1. Clone this repository
2. Run `npm install`
3. Run `npm run build` to generate the site
4. Run `npm run serve` to preview the site locally

## Writing Content

- Add Markdown files to `/src/content/pages` for regular pages
- Add blog posts to `/src/content/blog` as Markdown files
- Run the build script to generate HTML files

## Technologies Used

- HTML, CSS, JavaScript
- Node.js for build scripts
- Marked (for Markdown conversion)
- Simple HTTP server for local development
