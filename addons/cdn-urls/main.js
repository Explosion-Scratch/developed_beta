export default function({current, copy, notif}) {
    var app = Vue.createApp({
        data(){
            return {
                searching: false,
                query: "",
                results: [],
            }
        },
        methods: {
            url(item){
                return `https://cdnjs.cloudflare.com/ajax/libs/${item.name}/${item.version}/${item.filename}`
            },
            copyScript(item){
                if (item.fileType === "js"){
                    copy(`<script src=${JSON.stringify(this.url(item))}></script>`);
                } else if (item.fileType === "css"){
                    copy(`<link rel="stylesheet" href=${JSON.stringify(this.url(item))}/>`);
                } else {
                    return notif(`Unknown file type (${item.fileType})`);
                }
                notif(`Copied ${item.fileType === "js" ? "script" : "link"} tag`);
            },
            copyUrl(item){
                copy(this.url(item));
                notif(`Copied url of ${item.name}`);
            }
        },
        watch: {
            async query(){
                this.results = await getResults(this.query);
            }
        }
    }).mount(current);
    async function getResults(query) {
        var {
            results: [{
                hits: results
            }]
        } = await fetch("https://cors.explosionscratc.repl.co/2qwlvlxzb6-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.5.1)%3B%20Browser%3B%20instantsearch.js%20(4.8.1)%3B%20Vue%20(2.6.12)%3B%20Vue%20InstantSearch%20(3.2.0)%3B%20JS%20Helper%20(3.2.2)", {
            "headers": {
                "accept": "*/*",
                "x-algolia-api-key": "2663c73014d2e4d6d1778cc8ad9fd010",
                "x-algolia-application-id": "2QWLVLXZB6"
            },
            "body": JSON.stringify({
                requests: [{
                    indexName: "libraries",
                    params: `query=${escape(query)}&highlightPreTag=__ais-highlight__&highlightPostTag=__%2Fais-highlight__&page=0&facets=%5B%5D&tagFilters=`,
                }, ],
            }),
            "method": "POST",
        }).then(res => res.json())
        return results;
    }
}