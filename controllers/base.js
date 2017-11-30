class Base {
    constructor() {
        this.urls = {
            email: "https://graph.microsoft.com/v1.0/me/mailfolders/inbox/messages?$top=4&",
            news: "https://prioriti.net/liferay/o/blog-service/blogs/categories/news",
            calendar: "https://graph.microsoft.com/v1.0/me/calendarview?startdatetime="
        }

        this.config = {
            version: "1.0",
            response: {
                outputSpeech: {
                    ssml: "",
                    type: "SSML"
                },
                speechletResponse: {
                    outputSpeech: {
                        ssml: ""
                    },
                    shouldEndSession: true
                }
            },
            sessionAttributes: {}
        }
    }

    get outputSpeech() {
        return this.config.response.outputSpeech.ssml
    }

    set outputSpeech(value) {
        this.config.response.outputSpeech.ssml = value
    }

    get speechletResponse() {
        return this.config.response.speechletResponse.outputSpeech.ssml
    }

    set speechletResponse(value) {
        this.config.response.speechletResponse.outputSpeech.ssml = value
    }
}

module.exports = Base