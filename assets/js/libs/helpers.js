import fs from 'fs';

// Structure from: https://webcontainers.io/api#%E2%96%B8-directory-filesystemtree
window.convertFolderIntoFileSystemTree = function (folder) {
    // read the folder contents
    fs.readdir(folder, (err, files) => {
        console.log(files);
    });
}