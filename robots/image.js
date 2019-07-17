const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const imageDownloader = require('image-downloader')
const state = require('./state.js')

const googleSearchCredentials = require('../credentials/google-search.json')

async function robot() {
	console.log(`> [Image-robot] Starting...`)
	const content = state.load()

	await fetchImagesOfAllSetences(content)
	await downloadFromAllImages(content)

	state.save(content)

	async function fetchImagesOfAllSetences(content){

		await catchTheThumbnailImage()
		//await catchTheCommomSentences()

		async function catchTheCommomSentences(){

			for(const sentence of content.sentences){
				const query = `${content.searchTerm} ${sentence.keywords[0]}`
				console.log(`[Image-robot] Querying Google Images with ${query}`)

				sentence.images = await fetchGoogleAndReturnImagesLinks(query)

				sentence.gooogleSearchQuery = query
			}
		}

		async function catchTheThumbnailImage(){
			
			for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++){
				let query

				if(sentenceIndex === 0){
					query = `${content.searchTerm}`
				} else{
					query = `${content.searchTerm} ${content.sentences[sentenceIndex].keywords[0]}`
				}

				console.log(`> [Image-robot] Querying Google Images with ${query}`)

				content.sentences[sentenceIndex].images = await fetchGoogleAndReturnImagesLinks(query)
				content.sentences[sentenceIndex].gooogleSearchQuery = query
			}
		}
		//[BUG] Bandas com o mesmo nome e musica, baixam uma imagem a menos
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
						throw new Error(' [Image-robot] Imagem already downloaded!')
					}
					
					await downloadAnSave(imageUrl, `${sentenceIndex}-original.png`)
					content.downloadedImages.push(imageUrl)
					console.log(`> [Image-robot] [${sentenceIndex}][${imageIndex}] Image sucessfully downloaded ${imageUrl} `)
					break
				}
				catch(error){
					console.log(`> [Image-robot] [${sentenceIndex}][${imageIndex}] Download error (${imageUrl}): ${error} `)
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