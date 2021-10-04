export default async function ({
  runScript,
  path,
  withPermissions,
  storage: { sync: storage },
  copy,
  notif,
  options,
} = {}) {
  var editor = {};
  const editor_options = {
    cursorSmoothCaretAnimation: true,
    dragAndDrop: true,
    fontLigatures: true,
    fontFamily: "Fira Code",
    cursorBlinking: "smooth",
    smoothScrolling: true,
    renderWhitespace: "selection",
    minimap: { enabled: false },
    multiCursorModifier: "ctrlCmd",
    copyWithSyntaxHighlighting: true,
    formatOnType: true,
    formatOnPaste: true,
    scrollBeyondLastLine: false,
    automaticLayout: true,
  };
  function init() {
    return new Promise((res) => {
      require.config({
        paths: {
          vs:
            "https://cors.explosionscratc.repl.co/cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs",
        },
      });
      window.MonacoEnvironment = { getWorkerUrl: () => proxy };
      let proxy = URL.createObjectURL(
        new Blob(
          [
            `
    self.MonacoEnvironment = {
      baseUrl: 'https://cors.explosionscratc.repl.co/cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min'
    };
    importScripts('https://cors.explosionscratc.repl.co/cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs/base/worker/workerMain.min.js');
    `,
          ],
          { type: "text/javascript" }
        )
      );
      require(["vs/editor/editor.main"], editorContext);
    });
  }
  init();

  async function editorContext() {
    var data = await fetch(`${path}/theme.json`).then((res) => res.json());
    console.log("Set theme", data);
    monaco.editor.defineTheme("custom", data);
    monaco.editor.setTheme("custom");
    if (options.code){
        notif("You're edits to this code snippet are not autosaved, to prevent overwriting your previous snippet")
    }
    editor = create({
      language: "javascript",
      selector: ".editor",
      value: options.code || await storage.get("code") || "",
    });
    (() => {
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_B,
        beautify,
      );
      editor.getModel().onDidChangeContent(() => {
        if (options.save !== false){
            storage.set("code", editor.getValue());
        }
      });
    })();
    function create({ value = "", language, selector }) {
      let editor = monaco.editor.create(document.querySelector(selector), {
        value: value,
        language: language,
        theme: "custom",
        ...editor_options,
      });
      return editor;
    }
  }
  
  function beautify() {
      const value = editor.getValue();
      console.log("Beautifying");
      console.log("Cursor position is:");
      var position = editor.getPosition();
      console.log(position);
      console.log("Cursor index is:");
      var model = monaco.editor.createModel(value);
      var index = model.getOffsetAt(position);
      console.log(index);
      var val = prettier.formatWithCursor(value, {
        cursorOffset: index,
        parser: "babel",
        plugins: prettierPlugins,
      });
      editor.setValue(val.formatted);
      var newModel = monaco.editor.createModel(val.formatted);
      var newIndex = model.getPositionAt(val.cursorOffset);
      console.log({ newModel, newIndex });
      editor.setPosition(newIndex);
    }
    
  document.querySelector(".buttons").addEventListener("click", async (e) => {
    try {
      switch (e.target.id) {
        case "run":
          runScript(editor.getValue());
          break;
        case "copy":
          copy(editor.getValue());
          notif({ text: "Copied!", pos: "bottom-right" });
          break;
        case "beautify":
          beautify();
          break;
        case "minify":
          editor.setValue(
            (
              await Terser.minify(editor.getValue(), {
                compress: { ecma: "2015", hoist_funs: true },
                format: { quote_style: 2 },
              })
            ).code
          );
          break;
        default:
          break;
      }
    } catch (e) {
      notif({ text: e.message, pos: "bottom-right" });
    }
  });
}
