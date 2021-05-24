'use strict'

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.query === 'copy') {
		let data = { cid: 0, insufficient: false, parseItem: false, spell: [], rune: [], item: { 0: [], 1: [], 2: [], 3: [], 4: [] } }
		let imgs = document.getElementsByTagName('img')
		let divs = document.getElementsByTagName('div')
		let ikey = 0

		let nodata = document.evaluate('string(//*[@id="root"]/div/div[3]/center/h3[1])', document, null, XPathResult.ANY_TYPE, null).stringValue.includes('No data')
		let insuf1 = document.evaluate('string(//*[@id="root"]/div/div[3]/div[2]/div[7]/h2/text())', document, null, XPathResult.ANY_TYPE, null).stringValue.includes('Insufficient')
		let insuf2 = document.evaluate('string(//*[@id="root"]/div/div[3]/div[2]/div[8]/h2/text())', document, null, XPathResult.ANY_TYPE, null).stringValue.includes('Insufficient')
		data.insufficient = nodata || insuf1 || insuf2

		for (const img of imgs) {
			if (data.cid !== 0 && data.spell.length === 2) break
			if (data.cid === 0 && img.src && img.src.includes('champion')) data.cid = img.dataset.id
			else if (data.spell.length < 2 && img.src && img.src.includes('summonerspell')) data.spell.push(img.dataset.id * 1)
		}

		for (const div of divs) {
			if (data.rune.length < 9 && div.dataset.type === 'rune' && div.className === '') data.rune.push(div.dataset.id.substring(0, 4) * 1)
		}

		for (let i = 0;i < 5;i++) {
			if (ikey === 0) {
				if (document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[8]/div[4]/div[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null) ikey = 8
				else if (document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[9]/div[4]/div[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null) ikey = 9
				else if (document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[10]/div[4]/div[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null) ikey = 10	
				if (ikey === 0) {
					sendResponse(data)
					return true
				}
			}
			let idivs = document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div['+ikey+']/div[4]/div['+(i+1)+']', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.querySelectorAll('*')
			for (const idiv of idivs) { if (idiv.src && idiv.src.includes('item')) data.item[i].push(idiv.dataset.id) }
		}
		data.parseItem = true
		sendResponse(data)
	}
	return true
})