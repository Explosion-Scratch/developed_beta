export default async function({runScript, withPermissions, storage: {local: storage}, copy} = {}){
    var stored = await storage.get("code");
    
    const flask = new CodeFlask('.editor', {
      language: 'js',
      lineNumbers: true,
    });
    
    if (stored){
        flask.updateCode(stored);
    }
    
    flask.onUpdate((code) => {
        storage.set("code", code);
    })
    
    document.querySelector(".buttons").addEventListener("click", (e) => {
        switch(e.target.id){
            case "run":
                runScript(flask.getCode());
                break;
            case "copy":
                copy(flask.getCode());
                break;
            case "beautify":
                flask.updateCode(prettier.format(flask.getCode(), {
                    parser: "babel",
                    //Need this for babel plugin
                    plugins: prettierPlugins,
                }));
                break;
            default:
                break;
        }
    })
}