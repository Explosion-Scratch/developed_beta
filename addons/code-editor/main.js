export default async function({runScript, withPermissions, storage: {local: storage}, copy, Snackbar: {show: notif}} = {}){
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
    
    document.querySelector(".buttons").addEventListener("click", async (e) => {
        try {
        switch(e.target.id){
            case "run":
                runScript(flask.getCode());
                break;
            case "copy":
                copy(flask.getCode());
                notif({text: "Copied!"});
                break;
            case "beautify":
                flask.updateCode(prettier.format(flask.getCode(), {
                    parser: "babel",
                    //Need this for babel plugin
                    plugins: prettierPlugins,
                }));
                break;
            case "minify":
                flask.updateCode((await Terser.minify(
                  flask.getCode(),
                  { compress: { ecma: "2015", hoist_funs: true }, format: { quote_style: 2 } }
                )).code)
                break;
            default:
                break;
        }
        } catch(e){
            notif({text: e.message});
        }
    })
}