export default async function({current, notif, copy, loadAddon}){
    const base = `https://quick-code-search-testing-thing.explosionscratc.repl.co`
    var app = Vue.createApp({
        data(){
            return {
                //Current answer
                answer: {},
                //List of answers to the active question
                answers: [],
                //List of questions
                questions: [],
                //Current question
                activeQuestion: {},
                //Used to watch the select dropdowns for answers
                questionID: null,
                answerID: null,
                //Query searched by user
                query: "",
                searching: false,
            }
        },
        methods: {
            async search(){
                this.searching = true;
                console.log("Searching for %o", this.query);
                this.questions = await fetch(`${base}/question?q=${escape(this.query)}`).then(res => res.json());
                this.questions = this.questions.filter(i => i.id);
                this.activeQuestion = this.questions[0]
            },
            trim(text, length){
                return text.length >= length - 3 ? `${text.slice(0, length - 3)}...` : text;
            },
            edit(){
                notif("Loading...");
                loadAddon("code-editor", {code: this.htmlDecode(this.selected), save: false})
            },
            copySelected(){
                // ok
                copy(this.htmlDecode(this.selected));
                notif("Copied!")
            },
            htmlDecode(input) {
              var doc = new DOMParser().parseFromString(input, "text/html");
              return doc.documentElement.textContent;
            }

        },
        computed: {
            selected(){
                return this.answer.code;
            }
        },
        watch: {
            async activeQuestion(){
                console.log('activeQuestion updated');
                this.questionID = this.activeQuestion.id;
                //Get list of answers with code (parsing html is done via server)
                this.answers = (await fetch(`${base}/answer?id=${this.activeQuestion.id}`).then(res => res.json())).items.filter(i => i.code);
                this.answer = this.answers.filter(i => i.code).orderBy(i => i.score, true)[0];
                this.answerID = this.answer.answer_id;
                this.searching = false;
                console.log("Currently have answers: %o and answer: %o", this.answers, this.answer);
            },
            questionID(){
                this.activeQuestion = this.questions.find(i => i.id === this.questionID);
            },
            answerID(){
                this.answer = this.answers.find(i => i.answer_id === this.answerID);
            }
        },
    }).use(Vue3Highlightjs).mount(current);
    
    Array.prototype.orderBy = function (selector, desc = false) {
        return [...this].sort((a, b) => {
            a = selector(a);
            b = selector(b);

            if (a == b) return 0;
            return (desc ? a > b : a < b) ? -1 : 1;
        });
    }
}