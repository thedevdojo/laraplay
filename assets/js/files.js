/** @satisfies {import('@webcontainer/api').FileSystemTree} */

export const files = {
    'index.js': {
      file: {
        contents: `
        
            import {
                NodePHP
            } from '@php-wasm/node';
            import https from 'https';
            import fs from 'fs';
            import AdmZip from 'adm-zip';
            import express from 'express';
            import { fileURLToPath } from 'url';
            import path from 'path';
            const app = express();
            const port = 3111;
  
            let sandbox = JSON.parse(fs.readFileSync('./sandbox.json', { encoding: 'utf8', flag: 'r' }));
            
            console.log('sandbox');
            console.log(sandbox);
            
            const php = await NodePHP.load('8.2', {
                requestHandler: {
                    documentRoot: './app/public',
                    absoluteUrl: 'http://localhost:' + port,
                    isStaticFilePath: (path) => path.includes('build/assets')
                },
            });
            
            const appParentDirectory = '.'; // . for local
            const appDirectory = '/app';
            const zipFile = 'https://cdn.devdojo.com/sandbox/php/zips/' + sandbox.repo + '.zip';

            console.log('get zip: ');
            console.log(zipFile);
            
            php.setPhpIniEntry('allow_url_fopen', 'On');
          php.setPhpIniEntry('disable_functions', 'proc_open,popen,curl_exec,curl_multi_exec');
  
            php.mkdir(appDirectory);
            php.chdir(appDirectory);
            
            php.mount(appParentDirectory, appDirectory);
            
            get_app().then((value) => {
                
                app.use(express.urlencoded({ extended: true }));
                app.use(express.json());
                app.use(express.static(appParentDirectory + appDirectory + '/public'));
                
  
                app.all('*', async (req, res) => {
                    if (req.url.includes('build/assets') || req.url.includes('favicon.ico')) {
                        let dirname = fileURLToPath(new URL('.', import.meta.url));
  
                        res.sendFile(path.join(process.cwd(), 'public', req.url));
  
                        return;
                    }
                    
                    console.log(req.method + ' - ' + req.url);
                    
                    php.addServerGlobalEntry('SCRIPT_NAME', '/index.php');
                    php.addServerGlobalEntry('SCRIPT_FILENAME', '/app/public/index.php');
  
                    const response = await php.request({
                        method: req.method,
                        url: req.url,
                        headers: req.headers,
                        // body: req.body,
                        formData: req.body,
                    });
  
                    res.status(response.httpStatusCode);
  
                    for (const [key, value] of Object.entries(response.headers)) {
                        res.set(key, value.join(''));
                    }
  
                    res.send(response.text);
                    
                });
  
                // place appReady file so we can check that the app is ready
                fs.writeFileSync('./communicate-with-webcontainer-files/app-ready', 'true');
  
                
  
                //let responseFile = loadFile();
                //responseFile.then((response) => { console.log(response.text); }).catch((err) => { console.log(err); });
            }).catch((err) => {
                console.log(err);
            });
            
            async function loadFile(){
                
                
  
                
  
                app.all('*', async (req, res) => {
  
                    console.log('accessed' + req.method + ' - ' + req.url);
  
                    if (req.url.includes('build/assets') || req.url.includes('favicon.ico')) {
                        let dirname = fileURLToPath(new URL('.', import.meta.url));
  
                        res.sendFile(path.join(process.cwd(), 'public', req.url));
  
                        return;
                    }
  
  
                    php.addServerGlobalEntry('SCRIPT_NAME', '/index.php');
                    php.addServerGlobalEntry('SCRIPT_FILENAME', '/app/public/index.php');
  
                    const response = await php.request({
                        method: req.method,
                        url: req.url,
                        headers: req.headers,
                        // body: req.body,
                        formData: req.body,
                    });
  
                    res.status(response.httpStatusCode);
  
                    for (const [key, value] of Object.entries(response.headers)) {
                        res.set(key, value.join(''));
                    }
  
                    res.send(response.text);
  
                    // console.log(req.method + ' - ' + req.url);
                    
                    // const response = await php.request({
                    //     method: req.method,
                    //     url: req.url,
                    //     headers: req.headers,
                    //     body: req.body
                    // });
                    // res.status(response.httpStatusCode);
                    // res.send(response.text);
                    
                });
            }
            
            
            function listFolderContents(folderPath) {
                return new Promise((resolve, reject) => {
                    fs.readdir(folderPath, (err, files) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(files);
                        }
                    });
                });
            }
            
            async function get_app() {
                return new Promise((resolve) => {
                    if(!fs.existsSync(appParentDirectory + appDirectory)){
                        const url = zipFile;
                        const destination = './app.zip';
                        const file = fs.createWriteStream(destination);
                        https.get(url, response => {
                            response.pipe(file);
                            file.on('finish', () => {
                                file.close();
                                const zip = new AdmZip(process.cwd() + "/app.zip");
                                zip.extractAllTo(appParentDirectory + appDirectory);
                                //listFolderContents(appParentDirectory + appDirectory).then(files => { console.log('Contents:', files); }).catch(err => { console.error('Error reading the folder:', err.message); });
                                resolve(true);
                            });
                        }).on('error', error => {
                            fs.unlink(destination); // Delete the file on error
                            console.error('Error downloading the file:', error.message);
                            resolve(false);
                        });
                    } else {
                        resolve(true);
                    }
                });
            }
  
            
                
            app.listen(port, () => {
                console.log('App is now available in the webcontainer 🚀');
              });
                
  
                // app.get('/', (req, res) => {
                //     res.send('Welcome to a WebContainers app! 🥳');
                //   });
              
              
        
        `,
      },
    },
    'directory-tree.js' : {
      file: {
        contents: `
          import fs from 'fs';
          import dirTree from 'directory-tree';
  
  
          const tree = dirTree('./app', { exclude: /vendor/, attributes:['open'] }, null, (item, PATH, stats) => {
              prioritizeChildren(item);
              fs.writeFileSync('./directory-tree.json', JSON.stringify(item), (err) => { if (err) throw err; });
          });
  
          console.log('written directory tree');
  
          function prioritizeChildren(item) {
              if (item.children && item.children.length) {
                item.children.sort(prioritizeChildrenComparator);
                item.children.forEach(prioritizeChildren);
              }
              return item;
            }
            
            function prioritizeChildrenComparator(a, b) {
              if (a.children && !b.children) {
                return -1;  // a has children, b doesn't
              } else if (!a.children && b.children) {
                return 1;   // b has children, a doesn't
              } else {
                return a.name.localeCompare(b.name); // if same type, sort by name
              }
            }
        `
      }
    },
    'package.json': {
      file: {
        contents: `
        {
            "name": "example-app",
            "type": "module",
            "dependencies": {
            "express": "latest",
            "nodemon": "latest",
            "@php-wasm/node": "^0.2.0",
            "fs": "^0.0.1-security",
            "axios": "^1.4.0",
            "path": "^0.12.7",
            "request": "^2.88.2",
            "https": "^1.0.0",
            "path": "^0.12.7",
            "download": "^8.0.0",
            "directory-tree": "^3.5.1",
            "adm-zip": "^0.5.10"
            },
            "scripts": {
            "start": "nodemon --ignore './app/*' --watch './index.js' index.js"
            }
        }`,
      },
    },
    'nodemon.json' : {
        file: {
            contents: `
            { 
                "verbose": true, 
                "ignore": ["app/**/*.*"]
            }
            `
        }
    }
  };
  