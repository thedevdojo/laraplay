window.directoryTree = function() {
    return {
        folders: [],
        paddingMultiplier: 12,
        hasChildren(fileOrFolder){
            return typeof(fileOrFolder.children) != 'undefined' && fileOrFolder.children.length;
        },
        isFolder(type){
            console.log(type);
            return type == 'folder';
        },
        isOpen(isOpen){
            return false;
        },
        fileClicked(path, name, hasChildren){
            console.log('clicked');
            console.log(hasChildren);
            if(hasChildren == 'false'){
                console.log('should have loaded');
                loadFile(path, name);
            }
        },
        toggle(path) {
            let folder = this.folders.files;
            for (let i = 0; i < path.length; i++) {
                if (i === path.length - 1) {
                    folder[path[i]].isOpen = !folder[path[i]].isOpen;
                } else {
                    folder = folder[path[i]].children;
                }
            }
            console.log(this.folders);
        },
        subfolderHTML(folder, path = []) {
            return folder.map((fileOrFolder, index) => {
                let newPath = [...path, index];
                let fileHasChildren = (typeof(fileOrFolder.children) != 'undefined' && fileOrFolder.children.length) ? true : false;
                let isOpen = (typeof(fileOrFolder.isOpen) != 'undefined') ? fileOrFolder.isOpen : false;
                let filePath = (typeof(fileOrFolder.path) != 'undefined') ? fileOrFolder.path : null;
                let fileName = (typeof(fileOrFolder.name) != 'undefined') ? fileOrFolder.name : null;

                return `
                    <li class="relative">
                        <span @click="toggle(${JSON.stringify(newPath)}); fileClicked('${filePath}', '${fileName}', '${fileHasChildren}');" class="w-full px-2 py-0.5 hover:bg-gray-400 hover:bg-opacity-10 block" :style="'padding-left:' + (paddingMultiplier*${newPath.length-1}) + 'px'">
                            <span x-show="${isOpen}" class="absolute top-0 h-full translate-x-0.5 pb-2 w-px ml-2.5 overflow-hidden">
                                <span class="absolute w-full h-full translate-y-5 bg-gray-700"></span>
                            </span>
                            <span  class="flex items-center space-x-1 px-1.5 text-gray-200 cursor-pointer">
                                <!-- Arrow Icon -->
                                <svg x-show="${fileHasChildren ? true : false }" :class="{ 'rotate-90' : ${isOpen}, 'rotate-0' : !${isOpen} }" class="w-3.5 h-3.5 transition-all duration-1000 fill-current ease-out" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill="currentColor" fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" /></svg>
                                <!-- FileOrFolder Text -->
                                <span class="inline-block rounded py-0.5">${fileOrFolder.name}</span>
                            </span>
                        </span>

                        ${fileHasChildren ? `<ul x-show="${isOpen}" class="pl-0">${this.subfolderHTML(fileOrFolder.children, newPath)}</ul>` : ``}
                        
                    </li>
                `;
            }).join("");
        },
        getDepth(path) {
            return path.length;
        }
    };
}