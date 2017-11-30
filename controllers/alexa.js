const Speech = require('ssml-builder');
const superagent = require('superagent');
const moment = require('moment');
const Base = require('./base');

class Alexa extends Base {
    constructor(token,startdate,enddate) {
        super()
        this.token = token;
        this.startdate = startdate;
        this.enddate = enddate ;
        
    }

    handleAction(action) {
        let fn = null;

        const intents = {
                'Email_widget': () => {
                    return this.handleEmail()
                },
                'Calendar_events': () => {
                    return this.handleCalendar()
                },
                'Recent_news': () => {
                    return this.handleNews()
                },
                'default': () => new Promise((_, reject) => reject(this.handleError('Sorry, i didn\'t get that')))
            }

            !!intents[action] ? fn = intents[action] : fn = intents['default']

        return fn()
    }

    handleEmail() {
        const speech = new Speech()
       
        return new Promise((resolve, reject) => {
            superagent
                .get(this.urls.email)
                .set('Authorization', 'Bearer' + this.token)
                .then(result => {
                    if (result.body.value.length > 0) {
                        speech
                            .say('This is what show up in your mail')
                            .pause('200ms')

                        result.body.value.map((email, i) => {
                            speech
                                .say(i + 1)
                                .pause('200ms')
                                .say('subject is')
                                .say(email.subject)
                                .pause('50ms')
                                .say('email sent from ' + email.from.emailAddress.name)
                                .pause('50ms')
                                .say('preview of mail is')
                                .pause('50ms')
                                .say(email.bodyPreview)
                                .pause('800ms')
                        })

                        speech.say('Thank You.')

                    } else {
                        speech
                            .say('You have no unread emails')
                            .pause('200ms')
                    }

                    this.outputSpeech = speech.ssml()
                    this.speechletResponse = speech.ssml()

                    return resolve(this.config)

                }).catch(err => reject(this.handleError(err)))
        })
    }

    handleCalendar() {
        const speech = new Speech()

        return new Promise((resolve, reject) => {
            superagent
                .get(this.urls.calendar +this.startdate +"&enddatetime="+this.enddate)
                .set('Authorization', 'Bearer' + this.token)
                .then(result => {
                    if (result.body.value.length > 0) {
                        speech
                            .say('Your events are')
                            .pause('350ms')

                        result.body.value.map((event, i) => {
                            speech
                                .say(`${i+1}.`)
                                .pause('50ms')
                                .say(`Event is on ${event.subject} and is scheduled on ${moment(event.start.dateTime).format("YYYY-MM-DD")} which is organized by ${event.organizer.emailAddress.name} and ends on ${moment(event.end.dateTime).format("YYYY-MM-DD")}`).pause('800ms')
                        })

                        speech.say('Thank You.')

                    } else {
                        speech
                            .say('No event is scheduled')
                            .pause('200ms')
                    }

                    this.outputSpeech = speech.ssml()
                    this.speechletResponse = speech.ssml()

                    return resolve(this.config)

                }).catch(err => reject(this.handleError(err)))
        })
    }

    handleNews() {
        const speech = new Speech()

        return new Promise((resolve, reject) => {
            superagent
                .get(this.urls.news)
                .set('Authorization', 'Bearer' + this.token)
                .then(result => {
                    if (result.body.data.length > 0) {
                        speech
                            .say('This is what trending in news from my source')
                            .pause('350ms')

                        result.body.data.map((news, i) => {
                            speech
                                .say(`${i+1}`)
                                .pause('50ms')
                                .say(`${news.title}`)
                                .pause('100ms')
                                .say(`${news.summary}`)
                                .pause('800ms')
                        })

                        speech.say('That\'s all from my source news. Thank You.')

                    } else {
                        speech
                            .say('Something went wrong. Please try it again')
                            .pause('200ms')
                    }

                    this.outputSpeech = speech.ssml()
                    this.speechletResponse = speech.ssml()

                    return resolve(this.config)

                }).catch(err => reject(this.handleError(err)))
        })
    }

    handleError(message = 'Something went wrong') {
        const speech = new Speech();

        speech
            .say(`${message}`)
            .pause('200ms')

        this.outputSpeech = speech.ssml()
        this.speechletResponse = speech.ssml()

        return this.config
    }

}

module.exports = Alexa