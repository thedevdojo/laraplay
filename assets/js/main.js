import { WebContainer } from '@webcontainer/api';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
// import 'xterm/css/xterm.css';
import { files } from './webcontainer/files';
import './webcontainer/directory-tree.js';
import Alpine from 'alpinejs';


let serverReady = false;
let containerURL = '';
const communcation_folder = 'communicate-with-webcontainer-files';
let appReadyInterval = null;
let readDirectiryInterval = null;
let directoryTreeData = null;

window.indexJSTextareaEl = null;
window.directoryTreeData = directoryTreeData;
window.selectedFile = null;
window.activeEditorId = null;
window.appFiles = [];
window.Alpine = Alpine;
window.webcontainer = null;

console.log(window.pathname);

window.org = null;
window.repo = window.location.pathname.replace(/^\/|\/$/g, '');

Alpine.start();

window.loadApp = function(sandBoxData){
    indexJSTextareaEl = document.getElementById('indexJs');
    indexJSTextareaEl.value = files['index.js'].file.contents;
  
    indexJSTextareaEl.addEventListener('input', (e) => {
        writeIndexJS(e.currentTarget.value);
    });

    const terminal = new Terminal({
        convertEol: true,
        rows: 10
    });
    terminal.open(document.getElementById('terminal'));
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    fitAddon.fit();

    window.terminal = terminal;

    // create multiple terminals
    const terminals = new Terminal({
        convertEol: true,
        rows: 10
    });
    terminals.open(document.getElementById('terminals'));
    const fitAddons = new FitAddon();
    window.fitAddons = fitAddons;
    terminal.loadAddon(fitAddons);
    fitAddons.fit();

    window.terminals = terminals;


    WebContainer.boot().then(webcontainerInstance => {
        webcontainer = webcontainerInstance;

        webcontainerInstance.mount(files).then(() => {
            console.log('mounted')
            writeSandboxJSON(webcontainerInstance).then(() => {
              webcontainerInstance.fs.mkdir('/' + communcation_folder).then(() => {
                  console.log('made here');

                  (async function (x) {
                      console.log('we can run here');
                  })();

                  installDependencies(webcontainerInstance, terminal).then(() => {
                    
                      startShell(webcontainerInstance, terminal);
                      startShell(webcontainerInstance, terminals);
                      startDevServer(webcontainerInstance, terminal);
                      startAppReadyInterval(webcontainerInstance, terminal);
                      

                      webcontainerInstance.on('server-ready', (port, url) => {

                        console.log('here!');
                        console.log(port, url);

                          if(!serverReady && port == '3111'){
                              serverReady = true;
                              containerURL = url;
                                window.dispatchEvent(new CustomEvent('set-url', { detail: { url: containerURL } }));
                              window.dispatchEvent(new CustomEvent('server-ready', {}));
                          }
                      });
                  });
              }).catch((error) => {
                  console.log('Error creating communication folder');
                  console.log(error);
              });
            }).catch((error) => {
              console.log('Error writing Sandbox JSON');
              console.log(error);
            });
        });
    });
}

window.addEventListener('load', async () => {
    console.log('loaded!');
});

window.readDirectory = function() {
    const dir = webcontainerInstance.fs.readdir('/app', { withFileTypes: true });
    dir.then((value) => {
        for(let i=0; i<value.length; i++){
            window.appFiles.push({
                "name": value[i].name,
                "isOpen": false,
                "dir": value[i].isDirectory(),
                "subfolders": []
            })
            console.log(value[i].name);
        }

        window.appFiles = [
            {
                "name": "Animals",
                "isOpen": false,
                "dir": true,
                "subfolders": []
            }
        ];

        window.dispatchEvent(new CustomEvent('update-folders', { detail: { folders: { files: window.appFiles } } }));
    });
    console.log(bytes);
}

function startShell(webcontainerInstance, terminal) {
    webcontainerInstance.spawn('jsh').then(shellProcess => {
        shellProcess.output.pipeTo(
            new WritableStream({
                write(data) {
                    terminal.write(data);
                },
            })
        );
  
        const input = shellProcess.input.getWriter();
        terminal.onData((data) => {
            input.write(data);
        });
  
        return shellProcess;
    }).catch(error => {
        console.log(error);
    });
};

async function installDependencies(webcontainerInstance, terminal) {
    const installProcess = await webcontainerInstance.spawn('npm', ['install']);
    installProcess.output.pipeTo(new WritableStream({
        write(data) {
            terminal.write(data);
        }
    }))
    return installProcess.exit;
}

function startAppReadyInterval(webcontainerInstance, terminal) {
    appReadyInterval = setInterval(function() {
        webcontainerInstance.fs.readFile('/' + communcation_folder + '/app-ready')
            .then(appReadyFile => {
                clearInterval(appReadyInterval);
                appReady(webcontainerInstance, terminal);
              console.log('hit again...');
                refreshDirectoryTree();

            })
            .catch(e => {
                console.log(e);
                console.log('not ready yet...');
            });
    }, 1000);
}

async function createDirectoryTree(webcontainerInstance, terminal) {
    const directoryTree = await webcontainerInstance.spawn('node', ['directory-tree.js']);
    directoryTree.output.pipeTo(new WritableStream({
        write(data) {
            terminal.write(data);
        }
    }))
}

async function createNewFile(webcontainerInstance, terminal) {
    await webcontainerInstance.fs.writeFile('app/new-file.txt', '');
    window.refreshDirectoryTree();
}

async function callAl(){
    const directoryTree = await webcontainerInstance.spawn('node', ['directory-tree.js']);
    directoryTree.output.pipeTo(new WritableStream({
        write(data) {
            window.terminal.write(data);
        }
    }))
}

window.callAlert = function(){
    (async function() {
        await callAl();
    })();
}

function startDevServer(webcontainerInstance, terminal) {
    webcontainerInstance.spawn('npm', ['run', 'start']).then(serverProcess => {
        serverProcess.output.pipeTo(
            new WritableStream({
                write(data) {
                    terminal.write(data);
                },
            })
        );
    }).catch(error => {
        console.log(error);
    });
}

async function writeIndexJS(content) {
    await webcontainer.fs.writeFile('/index.js', content);
};

window.refreshApp = function(){
  console.log('we go');
  webcontainer.fs.writeFile('/index.js', indexJSTextareaEl.value); 
}

async function writeSandboxJSON(webcontainerInstance) {
  console.log('here 👇');
  console.log(webcontainerInstance);
  let object = {
    vcs: 'github',
    type: 'app',
    org: org,
    repo: repo
  };
  await webcontainerInstance.fs.writeFile('/sandbox.json', JSON.stringify(object));
};

async function readDirectoryJson(webcontainerInstance){
    readDirectiryInterval = setInterval(async function(){
        try{
            const directoryTreeJSON = await webcontainerInstance.fs.readFile('/directory-tree.json', 'utf-8');
            window.appFiles = JSON.parse(directoryTreeJSON);
            window.dispatchEvent(new CustomEvent('update-folders', { detail: { folders: { files: Object.values([window.appFiles])[0].children } } }));
            clearInterval(readDirectiryInterval); 
        } catch(e) {
            console.log('no JSON Yet');
        }
    }, 1000);
}

window.refreshDirectoryTree = function(){

    createDirectoryTree(webcontainer, terminal).then(() => {
        readDirectoryJson(webcontainer).then(() => {
            console.log(webcontainer);
        }).catch((error) => {
            console.log('error refreshing directory: ');
            console.log(error);
        });
    });
}

window.addNewFile = function(){

    createNewFile(webcontainer, terminal).then(() => {
        console.log('created');
    });
}

const codeTextareaEl = document.getElementById('code');

window.loadFile = function(path, name){
    console.log('path is: ');
    console.log(path);
    const fileToLoad = webcontainer.fs.readFile(path, 'utf-8');
    fileToLoad.then((value) => {
        setActiveEditorValue(value);
        selectedFile = {
            "path": path,
            "name": name
        };
    }).catch((err) => {
        console.log(err);
    });
}

document.addEventListener("keydown", function(e) {
    if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)  && e.keyCode == 83) {
        e.preventDefault();
        if(selectedFile != null){
            let writeFile = webcontainer.fs.writeFile(selectedFile.path, getActiveEditorValue());
            writeFile.then((value) => {
                console.log('written: ' + value);
            }).catch((err) => { console.log(err); });
        }
    }
}, false);

function appReady(webcontainerInstance, terminal){
    console.log('do stuff now because app is ready');
    window.dispatchEvent(new CustomEvent('app-ready', {}));
}

window.setActiveEditorValue = function(value){
    document.getElementById(activeEditorId).editor.getModel().setValue(value);
}

window.getActiveEditorValue = function(){
    console.log('value: ');
    console.log(document.getElementById(activeEditorId).editor.getValue());
    return document.getElementById(activeEditorId).editor.getValue();
}