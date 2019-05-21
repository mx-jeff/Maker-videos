const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const imageDownloader = require('image-downloader')
const state = require('./state.js')

const googleSearchCredentials = require('../credentials/google-search.json')

async function robot() {
	const content = state.load()

	await fetchImagesOfAllSetences(content)
	await downloadFromAllImages(content)

	state.save(content)

	async function fetchImagesOfAllSetences(content){
		for (const sentence of content.sentences){
			const query = `${content.searchTerm} ${sentence.keywords[0]}`
			sentence.images = await fetchGoogleAndReturnImagesLinks(query)

			sentence.gooogleSearchQuery = query
		}
	}	

	async function fetchGoogleAndReturnImagesLinks(query) {

		const response = await customSearch.cse.list({
			auth: googleSearchCredentials.apikey,
			cx: googleSearchCredentials.searchEngineId,
			q: query,
			searchType: 'image',
			imgSize: 'huge',
			num: 2
		})

		const imagesUrl = response.data.items.map((item) => {
			return item.link
		})

		return imagesUrl
	}

	async function downloadFromAllImages(content){
	  	content.downloadedImages = []

      	for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
      		const images = content.sentences[sentenceIndex].images
      	

			for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        		const imageUrl = images[imageIndex]

				try {
					if (content.downloadedImages.includes(imageUrl)){
						throw new Error('Imagem já baixada!')
					}
					
					await downloadAnSave(imageUrl, `${sentenceIndex}-original.png`)
					content.downloadedImages.push(imageUrl)
					console.log(`> [${sentenceIndex}][${imageIndex}] Baixou a imagem com sucesso! ${imageUrl} `)
					break
				}
				catch(error){
					console.log(`> [${sentenceIndex}][${imageIndex}] Erro ao baixar (${imageUrl}): ${error} `)
				}
			}
		}
	}

	async function downloadAnSave(url, filename) {
		return imageDownloader.image({
			url: url,
			dest: `./content/${filename}`
		})
	}
	
}

module.exports = robot