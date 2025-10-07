#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageName = process.argv[2];
if (!packageName) {
    console.error('Usage: node build.js <package-name>');
    process.exit(1);
}

const packageDir = path.join(__dirname, '..', 'packages', packageName);
if (!fs.existsSync(packageDir)) {
    console.error(`Package directory not found: ${packageDir}`);
    process.exit(1);
}

console.log(`🏗️ Building ${packageName} package...`);

// Change to package directory
process.chdir(packageDir);

// Clean dist directory
if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
}

// Special handling for source package
if (packageName === 'source') {
    console.log('Using simplified build for source package...');
    
    // Run TypeScript compilation
    execSync('tsc -p tsconfig.esm.json', { stdio: 'inherit' });
    execSync('tsc -p tsconfig.cjs.json', { stdio: 'inherit' });
    
    console.log(`🎉 ${packageName} build complete!`);
    process.exit(0);
}

// Special handling for Vue packages
if (packageName.includes('vue')) {
    console.log('Using Vue build process...');
    
    // Check if specific tsconfig files exist
    const hasEsmConfig = fs.existsSync('tsconfig.esm.json');
    const hasCjsConfig = fs.existsSync('tsconfig.cjs.json');
    
    if (hasEsmConfig && hasCjsConfig) {
        // Use standard build process if configs exist
        console.log('Using standard ESM/CJS build for Vue package...');
    } else {
        // Use single tsconfig.json for Vue packages
        console.log('Using single tsconfig.json for Vue package...');
        execSync('tsc -p tsconfig.json --outDir dist', { stdio: 'inherit' });
        
        // Create basic package structure for Vue packages
        if (!fs.existsSync('dist/esm')) {
            fs.mkdirSync('dist/esm', { recursive: true });
        }
        if (!fs.existsSync('dist/cjs')) {
            fs.mkdirSync('dist/cjs', { recursive: true });
        }
        
        // Copy files to both formats
        const files = getAllFiles('dist').filter(file => file.endsWith('.js') || file.endsWith('.d.ts'));
        files.forEach(file => {
            const relativePath = path.relative('dist', file);
            const esmPath = path.join('dist/esm', relativePath);
            const cjsPath = path.join('dist/cjs', relativePath);
            
            // Ensure directories exist
            fs.mkdirSync(path.dirname(esmPath), { recursive: true });
            fs.mkdirSync(path.dirname(cjsPath), { recursive: true });
            
            // Copy files
            fs.copyFileSync(file, esmPath);
            fs.copyFileSync(file, cjsPath);
        });
        
        console.log(`🎉 ${packageName} build complete!`);
        process.exit(0);
    }
}

// Run TypeScript compilation and wyw-in-js processing for other packages
function compile(target, isEsm) {
    console.log(`Compiling ${target}...`);
    
    // TypeScript compilation
    const tsConfig = `tsconfig.${target}.json`;
    execSync(`tsc -p ${tsConfig} --outdir ./dist/${target}-tmp --declarationDir ./dist/dts-tmp`, { stdio: 'inherit' });
    
    // wyw-in-js processing
    execSync(`wyw-in-js -r dist/${target}-tmp/ -m esnext -o dist/${target}-tmp/ dist/${target}-tmp/**/*.js -t -i dist/${target}-tmp -c ../../config/linaria.json`, { stdio: 'inherit' });
    
    // Remove CSS imports
    removeCssImports(`dist/${target}-tmp`);
    
    // Replace old directory with new one
    if (fs.existsSync(`dist/${target}`)) {
        fs.rmSync(`dist/${target}`, { recursive: true, force: true });
    }
    fs.renameSync(`dist/${target}-tmp`, `dist/${target}`);
    
    // Move dts folder for ESM
    if (isEsm && fs.existsSync('dist/dts-tmp')) {
        if (fs.existsSync('dist/dts')) {
            fs.rmSync('dist/dts', { recursive: true, force: true });
        }
        fs.renameSync('dist/dts-tmp', 'dist/dts');
    }
    
    // Clean up build info
    const buildInfo = `dist/tsconfig.${target}.tsbuildinfo`;
    if (fs.existsSync(buildInfo)) {
        fs.unlinkSync(buildInfo);
    }
}

function removeCssImports(directory) {
    if (!fs.existsSync(directory)) return;
    
    const files = getAllFiles(directory);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            let content = fs.readFileSync(file, 'utf8');
            // Remove CSS import statements
            content = content.replace(/import\s+['"].*\.css['"];?\s*/g, '');
            fs.writeFileSync(file, content);
        }
    });
}

function getAllFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(filePath));
        } else {
            results.push(filePath);
        }
    });
    
    return results;
}

function generateIndexCss() {
    if (!fs.existsSync('dist/esm')) return;
    
    const cssFiles = getAllFiles('dist/esm').filter(file => file.endsWith('.css'));
    let cssContent = '/* Auto-generated file */\n';
    
    cssFiles.forEach(file => {
        const relativePath = path.relative('dist/esm', file).replace(/\\/g, '/');
        cssContent += `@import "./esm/${relativePath}";\n`;
    });
    
    fs.writeFileSync('dist/index.css', cssContent);
}

// Run compilations in parallel using Promise.all
async function runBuild() {
    try {
        await Promise.all([
            new Promise((resolve, reject) => {
                try {
                    compile('esm', true);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }),
            new Promise((resolve, reject) => {
                try {
                    compile('cjs', false);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
        ]);
        
        generateIndexCss();
        console.log(`🎉 ${packageName} build complete!`);
    } catch (error) {
        console.error(`Build failed for ${packageName}:`, error);
        process.exit(1);
    }
}

runBuild();