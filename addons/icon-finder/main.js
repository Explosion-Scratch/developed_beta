export default async function({copy, Snackbar}){
    console.log(document.querySelector("#search"))
    document.querySelector("#search").onclick = async () => {
        console.log("Searching");
        var text = await fetch(`https://api.iconify.design/search?query=${escape(document.querySelector("input").value)}&limit=1&callback=r`).then(res => res.text());
        var {icons} = JSON.parse(fix(text));
        icons = icons.map(async n => {
            n = n.split(":");
            var text = await fetch(`https://api.iconify.design/${n[0]}.js?icons=${n[1]}&callback=r`).then(res => res.text());
            var json = JSON.parse(fix(text));
            var svg = `<div class="icon"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${json.icons[n[1]].width || json.width} ${json.height}">${json.icons[n[1]].body}</svg></div>`;
            return svg;
        })
        icons = await Promise.all(icons);
        document.querySelector("#icons").innerHTML = icons.join("");
    }
    document.addEventListener('click', ({target}) => {
        if (target.closest(".icon")){
            copy(target.closest(".icon").querySelector("svg").outerHTML);
            Snackbar.show({pos: "bottom-right", text: "Copied"})
        } else {
            console.log(target);
        }
    })
    function fix(json){
        return json.replace(/^r\(/, "").replace(/\);$/, "");
    }
}