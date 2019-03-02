/*@robo escravo*/
const readline = require('readline-sync')

function start(){
	const content = {}

	content.searchTerm = askAndReturnSearchTerm()
	content.prefix = askAndReturnPrefix()

	function askAndReturnSearchTerm(argument) {
		return readline.question('Wikipedia: ')
	}

	function askAndReturnPrefix(){
		const prefixes = ['Quem e', 'O que e', 'A historia de']
		const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Escolha uma option: ') 
		const selectedPrefixText = prefixes[selectedPrefixIndex]

		return selectedPrefixText
	}
	console.log(content)
}

start()