const algoritmia = require('algorithmia')
const algoritmiaApiKey = require('../credentials/algorithmia.json').apiKey
const setenceBoundaryDetection = require('sbd')
const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')
const state = require('./state.js') 

const nlu = new NaturalLanguageUnderstandingV1({
 	iam_apikey: watsonApiKey,
	version: '2018-04-05',
	url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
})

async function robot() {
	console.log('> [Text-robot] Starting...')
	const content = state.load()

	await fetchContentFromWikipedia(content)
	sanitizeContent(content)
	breakContentIntoSentences(content)
	limitMaximumSentences(content)
	await fetchKeywordsofAllSentences(content)

	state.save(content)
	
	async function fetchContentFromWikipedia(content){
		console.log('> [Text-robot] Fetching content from wikipedia')
		const algoritmiaAuthenticated = algoritmia(algoritmiaApiKey)
		const wikipediaAlgorithm = algoritmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
		const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
		const wikipediaContent = wikipediaResponse.get()
		
		content.sourceContentOriginal = wikipediaContent.content
		console.log('> [Text-robot] Fetching done!')
	}

	function sanitizeContent(content){
		const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
		const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)
		

		content.sourceContentSanitized = withoutDatesInParentheses

		function removeBlankLinesAndMarkdown(text){
			const allLines = text.split('\n')
			
			const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
				if (line.trim().lenght === 0 || line.trim().startsWith('=')) {
					return false
				} else {
					return true
				}
			})

			return withoutBlankLinesAndMarkdown.join(' ')
		}
		
		function removeDatesInParentheses(text){
			return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
		}	
	}

	function breakContentIntoSentences(content){
		content.sentences = []

		const sentences = setenceBoundaryDetection.sentences(content.sourceContentSanitized)

		sentences.forEach((sentences) => {
			content.sentences.push({
				text: sentences,
				keywords: [],
				images: []
			})
		})
	}

	function limitMaximumSentences(content){
		content.sentences = content.sentences.slice(0, content.maximumSentences)
	}

	async function fetchKeywordsofAllSentences(content){
		console.log('> [Text-robot] Fetching keywords from Watson')
		for (const sentence of content.sentences){
			console.log(`[Text-robot] Sentence: ${sentence.text}`)

			sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)

			console.log(`> [Text-robot] ${sentence.keywords.join(', ')}\n`)
		}
	} 

	async function fetchWatsonAndReturnKeywords(sentence){
		return new Promise((resolve, reject) => {

			nlu.analyze({
				text: sentence,
				features: {
					keywords: {}
				}	
			}, (error, response) => {
				if (error){
					reject(error)
					return
				}

				const keywords = response.keywords.map((keyword) => {
					return keyword.text
				})

				resolve(keywords)
			})

		})
	}
}

module.exports = robot