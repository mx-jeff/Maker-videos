const algoritmia = require('algorithmia')
const algoritmiaApiKey = require('../credentials/algorithmia.json').apiKey
const setenceBoundaryDetection = require('sbd')

async function robot(content){
	await fetchContentFromWikipedia(content)
	sanitizeContent(content)
	breakContentIntoSentences(content)

	
	async function fetchContentFromWikipedia(content){
		const algoritmiaAuthenticated = algoritmia(algoritmiaApiKey)
		const wikipediaAlgorithm = algoritmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
		const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
		const wikipediaContent = wikipediaResponse.get()
		
		content.sourceContentOriginal = wikipediaContent.content
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
}

module.exports = robot